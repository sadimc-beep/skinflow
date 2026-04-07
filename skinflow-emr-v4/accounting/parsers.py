"""
Bank statement file parsers.

Both parsers return a list of dicts:
    {
        'date': datetime.date,
        'description': str,
        'reference': str,
        'amount': Decimal,   # positive = money in, negative = money out
        'raw_text': str,     # original row for audit
    }
"""
import csv
import io
import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation


# ── Date parsing ─────────────────────────────────────────────────

_DATE_FMTS = [
    '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y',
    '%d-%m-%Y', '%m-%d-%Y',
    '%d %b %Y', '%d %B %Y',
    '%Y%m%d',
]


def _parse_date(value: str) -> date:
    value = value.strip()
    for fmt in _DATE_FMTS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date format: {value!r}")


def _parse_amount(value: str) -> Decimal:
    """Strip currency symbols and thousands separators, return Decimal."""
    cleaned = re.sub(r'[^\d.\-]', '', value.strip())
    if not cleaned or cleaned == '-':
        return Decimal('0')
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        raise ValueError(f"Cannot parse amount: {value!r}")


# ── CSV Parser ───────────────────────────────────────────────────

# Supported header patterns (lower-cased header cell → field):
_COL_DATE = {'date', 'transaction date', 'txn date', 'value date', 'posting date', 'tran date'}
_COL_DESC = {'description', 'details', 'narrative', 'memo', 'particulars', 'transaction details'}
_COL_REF  = {'reference', 'ref', 'cheque no', 'check no', 'transaction id', 'txn id', 'id'}
_COL_CR   = {'credit', 'credits', 'deposit', 'deposits', 'money in', 'in'}
_COL_DR   = {'debit', 'debits', 'withdrawal', 'withdrawals', 'money out', 'out'}
_COL_AMT  = {'amount', 'net amount', 'value', 'net'}


def _detect_columns(headers: list[str]) -> dict:
    """Map CSV header names to field roles. Returns a dict with keys:
    date, description, reference (optional), credit (optional),
    debit (optional), amount (optional).
    Raises ValueError if required columns are missing.
    """
    lower = [h.strip().lower() for h in headers]
    mapping = {}

    for i, h in enumerate(lower):
        if h in _COL_DATE and 'date' not in mapping:
            mapping['date'] = i
        elif h in _COL_DESC and 'description' not in mapping:
            mapping['description'] = i
        elif h in _COL_REF and 'reference' not in mapping:
            mapping['reference'] = i
        elif h in _COL_CR and 'credit' not in mapping:
            mapping['credit'] = i
        elif h in _COL_DR and 'debit' not in mapping:
            mapping['debit'] = i
        elif h in _COL_AMT and 'amount' not in mapping:
            mapping['amount'] = i

    if 'date' not in mapping:
        raise ValueError(
            "CSV must have a 'Date' column. "
            f"Found headers: {headers}"
        )
    if 'description' not in mapping:
        raise ValueError(
            "CSV must have a 'Description' column. "
            f"Found headers: {headers}"
        )
    if 'amount' not in mapping and ('credit' not in mapping and 'debit' not in mapping):
        raise ValueError(
            "CSV must have either an 'Amount' column or separate 'Credit'/'Debit' columns."
        )
    return mapping


def parse_csv(file_obj) -> list[dict]:
    """
    Parse a bank statement CSV file.
    Accepts a file-like object (binary or text).
    Auto-detects column layout from headers.
    Skips rows where amount is zero or unparseable.
    """
    if isinstance(file_obj.read(0), bytes):
        text = file_obj.read().decode('utf-8-sig')  # strip BOM
    else:
        text = file_obj.read()

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if not rows:
        return []

    # Find the header row (first non-empty row)
    header_idx = 0
    for i, row in enumerate(rows):
        if any(cell.strip() for cell in row):
            header_idx = i
            break

    headers = rows[header_idx]
    try:
        col = _detect_columns(headers)
    except ValueError:
        raise

    results = []
    for row in rows[header_idx + 1:]:
        if not any(cell.strip() for cell in row):
            continue  # skip blank rows
        if len(row) <= max(col.values()):
            continue  # skip malformed rows

        raw_text = ','.join(row)

        try:
            txn_date = _parse_date(row[col['date']])
        except (ValueError, IndexError):
            continue

        description = row[col['description']].strip() if 'description' in col else ''
        reference = row[col['reference']].strip() if 'reference' in col else ''

        try:
            if 'amount' in col:
                amount = _parse_amount(row[col['amount']])
            else:
                credit_str = row[col['credit']].strip() if 'credit' in col else '0'
                debit_str = row[col['debit']].strip() if 'debit' in col else '0'
                credit = _parse_amount(credit_str) if credit_str else Decimal('0')
                debit = _parse_amount(debit_str) if debit_str else Decimal('0')
                amount = credit - debit  # positive = in, negative = out
        except ValueError:
            continue

        if amount == 0:
            continue

        results.append({
            'date': txn_date,
            'description': description,
            'reference': reference,
            'amount': amount,
            'raw_text': raw_text,
        })

    return results


# ── OFX Parser ───────────────────────────────────────────────────

def parse_ofx(file_obj) -> list[dict]:
    """
    Parse an OFX/QFX bank statement file.
    Handles both SGML (OFX 1.x) and XML (OFX 2.x) formats.
    """
    if isinstance(file_obj.read(0), bytes):
        raw = file_obj.read().decode('utf-8', errors='replace')
    else:
        raw = file_obj.read()

    # Detect format: OFX 2.x starts with <?xml
    if raw.lstrip().startswith('<?xml'):
        return _parse_ofx_xml(raw)
    else:
        return _parse_ofx_sgml(raw)


def _parse_ofx_xml(raw: str) -> list[dict]:
    """Parse OFX 2.x (proper XML)."""
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        raise ValueError(f"OFX XML parse error: {e}")

    results = []
    for txn in root.iter('STMTTRN'):
        results.append(_extract_ofx_txn(txn.find, lambda tag: (txn.find(tag) or _Stub()).text))
    return [r for r in results if r is not None]


def _parse_ofx_sgml(raw: str) -> list[dict]:
    """
    Parse OFX 1.x SGML — no closing tags, key:value headers.
    Strategy: strip header block, wrap tags with closing tags, parse as XML.
    """
    # Strip the OFXHEADER block (everything before <OFX>)
    ofx_start = raw.upper().find('<OFX>')
    if ofx_start == -1:
        raise ValueError("Not a valid OFX file — <OFX> tag not found.")
    body = raw[ofx_start:]

    # Auto-close SGML tags: add </TAG> before each new <TAG> at same level
    body = re.sub(r'<([A-Z0-9.]+)>([^<]+)', r'<\1>\2</\1>', body)

    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(body)
    except ET.ParseError as e:
        raise ValueError(f"OFX SGML parse error after auto-closing tags: {e}")

    results = []
    for txn in root.iter('STMTTRN'):
        def get(tag):
            el = txn.find(tag)
            return el.text.strip() if el is not None and el.text else ''
        results.append(_ofx_txn_from_getter(get))

    return [r for r in results if r is not None]


class _Stub:
    text = ''


def _ofx_txn_from_getter(get) -> dict | None:
    try:
        date_str = get('DTPOSTED') or get('DTUSER')
        # OFX dates: YYYYMMDDHHMMSS or YYYYMMDD
        txn_date = datetime.strptime(date_str[:8], '%Y%m%d').date()
        amount = Decimal(get('TRNAMT').replace(',', ''))
        description = get('NAME') or get('MEMO') or ''
        reference = get('FITID') or get('CHECKNUM') or ''
        return {
            'date': txn_date,
            'description': description,
            'reference': reference,
            'amount': amount,
            'raw_text': f"OFX:{reference}:{date_str}:{amount}",
        }
    except (ValueError, InvalidOperation):
        return None


def _parse_ofx_xml(raw: str) -> list[dict]:
    """Parse OFX 2.x (proper XML)."""
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        raise ValueError(f"OFX XML parse error: {e}")

    results = []
    for txn in root.iter('STMTTRN'):
        def get(tag, _txn=txn):
            el = _txn.find(tag)
            return el.text.strip() if el is not None and el.text else ''
        results.append(_ofx_txn_from_getter(get))

    return [r for r in results if r is not None]
