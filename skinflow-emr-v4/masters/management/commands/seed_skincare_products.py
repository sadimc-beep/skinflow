"""
Management command to seed a comprehensive skincare products catalog.
Creates ProductCategories, Units of Measure, Products with stock.
"""
from django.core.management.base import BaseCommand
from core.models import Organization
from inventory.models import ProductCategory, UnitOfMeasure, Product, StockLocation, StockItem

CATEGORIES = [
    "Cleansers & Toners",
    "Serums & Actives",
    "Moisturisers & Emollients",
    "Sunscreens & Photoprotection",
    "Exfoliants & Chemical Peels",
    "Eye & Lip Care",
    "Masks & Treatments",
    "Body Care",
    "Doctor-Strength Actives",
    "Clinic Consumables",
]

# UoMs: (name, abbreviation)
UOMS = [
    ("Piece", "pcs"),
    ("Bottle", "btl"),
    ("Tube", "tube"),
    ("Sachet", "sct"),
    ("Pump", "pmp"),
    ("Box", "box"),
    ("Ampoule", "amp"),
    ("Jar", "jar"),
    ("Strip", "strip"),
    ("Millilitre", "ml"),
]

# Products: (name, category, uom_abbr, sku, cost_price, sale_price, tax_rate)
PRODUCTS = [
    # ─── Cleansers & Toners ───
    ("CeraVe Hydrating Cleanser 236ml",           "Cleansers & Toners",           "btl",  "CLN-001", 480,  750,  0),
    ("La Roche-Posay Effaclar Foaming Gel 200ml",  "Cleansers & Toners",           "btl",  "CLN-002", 620,  980,  0),
    ("Bioderma Sensibio H2O 250ml",               "Cleansers & Toners",           "btl",  "CLN-003", 550,  890,  0),
    ("Cetaphil Gentle Skin Cleanser 250ml",        "Cleansers & Toners",           "btl",  "CLN-004", 390,  620,  0),
    ("Cosrx Low pH Good Morning Gel Cleanser",    "Cleansers & Toners",           "tube", "CLN-005", 380,  620,  0),
    ("Paula's Choice Pore-Reducing Toner 190ml",  "Cleansers & Toners",           "btl",  "CLN-006", 1200, 1900, 0),
    ("SOME BY MI AHA BHA PHA 30 Days Toner",      "Cleansers & Toners",           "btl",  "CLN-007", 520,  850,  0),
    ("Klairs Supple Preparation Toner 180ml",      "Cleansers & Toners",           "btl",  "CLN-008", 700,  1100, 0),

    # ─── Serums & Actives ───
    ("The Ordinary Hyaluronic Acid 2% + B5 30ml", "Serums & Actives",             "btl",  "SRM-001", 380,  640,  0),
    ("The Ordinary Niacinamide 10% + Zinc 30ml",  "Serums & Actives",             "btl",  "SRM-002", 380,  640,  0),
    ("Paula's Choice Niacinamide Booster 20ml",   "Serums & Actives",             "btl",  "SRM-003", 1800, 2800, 0),
    ("Medik8 C-Tetra Luxe Vitamin C Serum 30ml",  "Serums & Actives",             "btl",  "SRM-004", 2400, 3800, 0),
    ("SkinCeuticals C E Ferulic 30ml",            "Serums & Actives",             "btl",  "SRM-005", 6500, 9800, 0),
    ("Isntree Hyaluronic Acid Water Serum 50ml",  "Serums & Actives",             "btl",  "SRM-006", 580,  950,  0),
    ("Cosrx Advanced Snail 96 Mucin Power Essence","Serums & Actives",            "btl",  "SRM-007", 680, 1100,  0),
    ("Dr.Jart+ Ceramidin Serum 40ml",             "Serums & Actives",             "btl",  "SRM-008", 1800, 2800, 0),
    ("Olay Regenerist Micro-Sculpting Serum 50ml","Serums & Actives",             "btl",  "SRM-009", 900, 1400,  0),
    ("Innisfree JEJU Cherry Blossom Serum 50ml",  "Serums & Actives",             "btl",  "SRM-010", 780, 1250,  0),

    # ─── Moisturisers ───
    ("CeraVe Moisturising Cream 340g",            "Moisturisers & Emollients",    "jar",  "MST-001", 650, 1050,  0),
    ("Neutrogena Hydro Boost Water Gel 50g",      "Moisturisers & Emollients",    "jar",  "MST-002", 750, 1200,  0),
    ("La Roche-Posay Toleriane Double Repair",    "Moisturisers & Emollients",    "tube", "MST-003", 980, 1600,  0),
    ("Vanicream Moisturising Skin Cream 453g",    "Moisturisers & Emollients",    "jar",  "MST-004", 850, 1350,  0),
    ("Medik8 Advanced Day Total Protect 50ml",    "Moisturisers & Emollients",    "tube", "MST-005", 2200, 3400, 0),
    ("Bioderma Atoderm 500ml Body Cream",         "Moisturisers & Emollients",    "btl",  "MST-006", 870, 1400,  0),
    ("Aveeno Daily Moisturising Lotion 354ml",    "Moisturisers & Emollients",    "btl",  "MST-007", 780, 1250,  0),
    ("First Aid Beauty Ultra Repair Cream 170g",  "Moisturisers & Emollients",    "jar",  "MST-008", 1500, 2400, 0),

    # ─── Sunscreens ───
    ("Altruist SPF50+ Sun Fluid 200ml",           "Sunscreens & Photoprotection", "btl",  "SUN-001", 290,  490,  0),
    ("La Roche-Posay Anthelios UVMune SPF50+ 50ml","Sunscreens & Photoprotection","btl",  "SUN-002", 1200, 1900, 0),
    ("Isntree Hyaluronic Acid Watery Sun Gel",    "Sunscreens & Photoprotection", "tube", "SUN-003", 680, 1100,  0),
    ("COSRX Aloe SPF50 PA++++ Suncreen 50ml",    "Sunscreens & Photoprotection", "btl",  "SUN-004", 520,  850,  0),
    ("Bioré UV Aqua Rich Watery Essence SPF50+",  "Sunscreens & Photoprotection", "tube", "SUN-005", 680, 1100,  0),
    ("EltaMD UV Clear SPF46 48g",                "Sunscreens & Photoprotection", "tube", "SUN-006", 2800, 4400, 0),
    ("Supergoop Unseen Sunscreen SPF40 50ml",     "Sunscreens & Photoprotection", "btl",  "SUN-007", 2500, 3900, 0),

    # ─── Exfoliants & Peels ───
    ("Paula's Choice 2% BHA Liquid Exfoliant 118ml","Exfoliants & Chemical Peels","btl", "EXF-001", 2400, 3800, 0),
    ("The Ordinary Glycolic Acid 7% Toning Solution","Exfoliants & Chemical Peels","btl","EXF-002",  380,  640, 0),
    ("Kate Somerville ExfoliKate Intensive 30ml", "Exfoliants & Chemical Peels",  "tube", "EXF-003", 3200, 5000, 0),
    ("Cosrx BHA Blackhead Power Liquid 100ml",    "Exfoliants & Chemical Peels",  "btl",  "EXF-004",  780, 1250, 0),
    ("Dermalogica Daily Microfoliant 74g",        "Exfoliants & Chemical Peels",  "jar",  "EXF-005", 2600, 4100, 0),
    ("Alpha-H Liquid Gold 100ml",                 "Exfoliants & Chemical Peels",  "btl",  "EXF-006", 2100, 3300, 0),

    # ─── Eye & Lip Care ───
    ("The Ordinary Caffeine Solution 5% + EGCG",  "Eye & Lip Care",               "btl",  "EYE-001",  380,  640, 0),
    ("La Roche-Posay Redermic Retinol Eye 15ml", "Eye & Lip Care",               "tube", "EYE-002", 1400, 2200, 0),
    ("CeraVe Eye Repair Cream 14ml",             "Eye & Lip Care",               "tube", "EYE-003",  780, 1250, 0),
    ("Kiehl's Creamy Eye Treatment with Avocado","Eye & Lip Care",               "tube", "EYE-004", 1800, 2800, 0),
    ("Laneige Lip Sleeping Mask 20g",            "Eye & Lip Care",               "jar",  "EYE-005",  590,  950, 0),

    # ─── Masks & Treatments ───
    ("Innisfree Jeju Volcanic Pore Clay Mask 100ml","Masks & Treatments",         "tube", "MSK-001",  580,  950, 0),
    ("The Ordinary Salicylic Acid 2% Masque 50ml","Masks & Treatments",          "jar",  "MSK-002",  380,  640, 0),
    ("Glamglow Supermud Clearing Treatment 50g",  "Masks & Treatments",          "jar",  "MSK-003", 2800, 4400, 0),
    ("Osea Hyaluronic Sea Serum Mask",           "Masks & Treatments",           "jar",  "MSK-004", 2200, 3500, 0),
    ("Dr. Jart+ Cicapair Tiger Grass Mask 110ml","Masks & Treatments",           "tube", "MSK-005", 1200, 1900, 0),
    ("Skin Republic Collagen Sheet Mask",        "Masks & Treatments",           "pcs",  "MSK-006",  120,  200, 0),
    ("Cosrx Acne Pimple Master Patch",           "Masks & Treatments",           "box",  "MSK-007",  180,  300, 0),

    # ─── Body Care ───
    ("CeraVe Body Lotion 473ml",                 "Body Care",                    "btl",  "BDY-001",  650, 1050, 0),
    ("Aveeno Positively Radiant Body Lotion 354ml","Body Care",                  "btl",  "BDY-002",  750, 1200, 0),
    ("Cetaphil Moisturising Lotion 250ml",       "Body Care",                    "btl",  "BDY-003",  450,  720, 0),
    ("Palmer's Cocoa Butter Formula 400g",       "Body Care",                    "tube", "BDY-004",  350,  560, 0),
    ("Gold Bond Rough & Bumpy Skin Lotion 226ml","Body Care",                   "btl",  "BDY-005",  650, 1050, 0),

    # ─── Doctor-Strength Actives ───
    ("Tretinoin 0.025% Cream 20g",               "Doctor-Strength Actives",      "tube", "DOC-001", 300,  600, 0),
    ("Tretinoin 0.05% Cream 20g",                "Doctor-Strength Actives",      "tube", "DOC-002", 350,  700, 0),
    ("Tretinoin 0.1% Cream 20g",                 "Doctor-Strength Actives",      "tube", "DOC-003", 400,  800, 0),
    ("Hydroquinone 4% Cream 30g",                "Doctor-Strength Actives",      "tube", "DOC-004", 380,  760, 0),
    ("Azelaic Acid 20% Cream 30g",               "Doctor-Strength Actives",      "tube", "DOC-005", 450,  900, 0),
    ("Clindamycin 1% Gel 30g",                   "Doctor-Strength Actives",      "tube", "DOC-006", 280,  560, 0),
    ("Adapalene 0.1% Gel 15g",                   "Doctor-Strength Actives",      "tube", "DOC-007", 320,  640, 0),
    ("Niacinamide 10% + Zinc 2% Compounded Cream","Doctor-Strength Actives",    "tube", "DOC-008", 350,  700, 0),
    ("Kojic Acid 2% + Vitamin C 5% Compound Serum","Doctor-Strength Actives",   "btl",  "DOC-009", 600, 1200, 0),

    # ─── Clinic Consumables ───
    ("Sterile Gauze Swab 7.5cm x 7.5cm (Box/100)","Clinic Consumables",         "box",  "CON-001",  200,  400, 0),
    ("Disposable Gloves Latex M (Box/100)",       "Clinic Consumables",          "box",  "CON-002",  350,  700, 0),
    ("Hydrocolloid Wound Dressing (5 pack)",      "Clinic Consumables",          "box",  "CON-003",  180,  360, 0),
    ("Numbing Cream EMLA 5% 30g",                "Clinic Consumables",           "tube", "CON-004",  350,  700, 0),
    ("Normal Saline 0.9% Irrigation Bottle 500ml","Clinic Consumables",         "btl",  "CON-005",  120,  240, 0),
    ("Alcohol Swabs 70% IPA (Box/100)",          "Clinic Consumables",           "box",  "CON-006",  180,  360, 0),
    ("Cotton Rounds (Pack/100)",                 "Clinic Consumables",           "box",  "CON-007",  100,  200, 0),
    ("Microneedling Cartridge 36-Pin",           "Clinic Consumables",           "pcs",  "CON-008",  350,  700, 0),
    ("Dermaroller 0.5mm",                        "Clinic Consumables",           "pcs",  "CON-009",  280,  560, 0),
    ("Luer Lock Syringe 3ml (Box/10)",           "Clinic Consumables",           "box",  "CON-010",  200,  400, 0),
    ("Botox Dilution Saline 2ml Ampoule",        "Clinic Consumables",           "amp",  "CON-011",   80,  160, 0),
    ("Hyaluron Filler Cannula 25G 50mm",         "Clinic Consumables",           "pcs",  "CON-012",  220,  440, 0),
]

STOCK_LOCATION_NAME = "Main Pharmacy"
INITIAL_STOCK_QTY = 50  # units each


class Command(BaseCommand):
    help = 'Seed skincare product catalog (ProductCategories, UoMs, Products, stock)'

    def handle(self, *args, **kwargs):
        org = Organization.objects.first()
        if not org:
            self.stdout.write(self.style.ERROR('No organization found. Run seed_demo_data first.'))
            return

        # 1. Create categories
        cat_map = {}
        for cat_name in CATEGORIES:
            cat, _ = ProductCategory.objects.get_or_create(organization=org, name=cat_name)
            cat_map[cat_name] = cat
        self.stdout.write(f'  ✓ {len(cat_map)} product categories ready')

        # 2. Create UoMs
        uom_map = {}
        for uom_name, abbr in UOMS:
            uom, _ = UnitOfMeasure.objects.get_or_create(organization=org, abbreviation=abbr, defaults={'name': uom_name})
            uom_map[abbr] = uom
        self.stdout.write(f'  ✓ {len(uom_map)} units of measure ready')

        # 3. Ensure stock location
        location, _ = StockLocation.objects.get_or_create(organization=org, name=STOCK_LOCATION_NAME)
        self.stdout.write(f'  ✓ Stock location "{STOCK_LOCATION_NAME}" ready')

        # 4. Create Products + StockItems
        created_count = 0
        for name, cat_name, uom_abbr, sku, cost, sale, tax in PRODUCTS:
            product, created = Product.objects.get_or_create(
                organization=org,
                sku=sku,
                defaults={
                    'name': name,
                    'category': cat_map.get(cat_name),
                    'uom': uom_map.get(uom_abbr),
                    'product_type': (
                        'SKINCARE' if cat_name not in ('Clinic Consumables',) else 'CONSUMABLE'
                    ),
                    'is_stock_tracked': True,
                    'is_saleable': cat_name not in ('Clinic Consumables',),
                    'cost_price': cost,
                    'sale_price': sale,
                    'tax_rate': tax,
                }
            )
            if created:
                StockItem.objects.get_or_create(
                    organization=org,
                    product=product,
                    location=location,
                    defaults={'quantity': INITIAL_STOCK_QTY}
                )
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'  ✓ Created {created_count} new products (skipped duplicates) with {INITIAL_STOCK_QTY} units initial stock each.'
        ))
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded skincare product catalog!'))
