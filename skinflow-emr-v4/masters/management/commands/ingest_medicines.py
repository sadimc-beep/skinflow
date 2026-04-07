import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Organization
from masters.models import MedicineMaster

class Command(BaseCommand):
    help = 'Ingest medicine data from Kaggle CSV file'

    def handle(self, *args, **kwargs):
        csv_path = os.path.join(settings.BASE_DIR, 'masters', 'data', 'medicine.csv')
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'CSV file not found at {csv_path}'))
            return

        organization = Organization.objects.first()
        if not organization:
            self.stdout.write(self.style.ERROR('No organization found. Please run seed_demo_data first.'))
            return

        def map_dosage_form(form_str):
            form_str = str(form_str).lower()
            if 'tablet' in form_str:
                return MedicineMaster.FormChoices.TABLET
            elif 'capsule' in form_str:
                return MedicineMaster.FormChoices.CAPSULE
            elif 'syrup' in form_str or 'suspension' in form_str or 'solution' in form_str or 'drops' in form_str:
                return MedicineMaster.FormChoices.SYRUP
            elif 'ointment' in form_str:
                return MedicineMaster.FormChoices.OINTMENT
            elif 'cream' in form_str or 'gel' in form_str or 'lotion' in form_str:
                return MedicineMaster.FormChoices.CREAM
            elif 'injection' in form_str or 'iv' in form_str or 'im' in form_str:
                return MedicineMaster.FormChoices.INJECTION
            else:
                return MedicineMaster.FormChoices.OTHER

        self.stdout.write('Starting ingestion...')
        
        medicines_to_create = []
        batch_size = 1000
        count = 0

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                brand_name = row.get('brand name', '').strip()
                generic_name = row.get('generic', '').strip()
                strength = row.get('strength', '').strip()
                dosage_form_raw = row.get('dosage form', '').strip()
                
                # We need a generic name at least
                if not generic_name and not brand_name:
                    continue

                form_choice = map_dosage_form(dosage_form_raw)
                
                # Create model instance
                medicine = MedicineMaster(
                    organization=organization,
                    generic_name=generic_name,
                    brand_name=brand_name[:255],
                    strength=strength[:100],
                    form=form_choice
                )
                medicines_to_create.append(medicine)
                count += 1
                
                if len(medicines_to_create) >= batch_size:
                    MedicineMaster.objects.bulk_create(medicines_to_create, ignore_conflicts=True)
                    self.stdout.write(f'Created {count} records...')
                    medicines_to_create = []
                    
        # Flush remaining
        if medicines_to_create:
            MedicineMaster.objects.bulk_create(medicines_to_create, ignore_conflicts=True)
            self.stdout.write(f'Created {count} records...')

        self.stdout.write(self.style.SUCCESS(f'Successfully ingested {count} medicines from CSV!'))
