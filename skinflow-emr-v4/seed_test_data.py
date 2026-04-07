import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skinflow.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Organization, Provider
from masters.models import ProcedureCategory, ProcedureType, ProcedureRoom, MedicineMaster, LabTestMaster
from inventory.models import ProductCategory, UnitOfMeasure, Product, StockLocation, StockItem

def seed_data():
    # 1. Organization (Ensure one exists, or get the first one)
    org, created = Organization.objects.get_or_create(
        name='Skinflow Aesthetics Clinic',
        defaults={'slug': 'skinflow', 'address': '123 Test St, Dhaka'}
    )
    print(f"Organization: {org.name}")

    # 2. Users & Providers
    doctor_user, _ = User.objects.get_or_create(username='drsmith', defaults={
        'first_name': 'John', 'last_name': 'Smith', 'email': 'drsmith@example.com'
    })
    doctor_user.set_password('password123')
    doctor_user.save()
    
    provider, _ = Provider.objects.get_or_create(
        user=doctor_user, organization=org,
        defaults={'specialization': 'Dermatologist'}
    )
    print(f"Provider: {provider.user.get_full_name()}")

    # 3. Procedure Masters
    laser_cat, _ = ProcedureCategory.objects.get_or_create(
        organization=org, name='Laser Treatments'
    )
    skincare_cat, _ = ProcedureCategory.objects.get_or_create(
        organization=org, name='Skin Care'
    )
    
    proc1, _ = ProcedureType.objects.get_or_create(
        organization=org, category=laser_cat, name='Laser Hair Removal (Face)',
        defaults={'expected_default_sessions': 6, 'base_price': 5000.00, 'consultation_required': True}
    )
    proc2, _ = ProcedureType.objects.get_or_create(
        organization=org, category=skincare_cat, name='Chemical Peel',
        defaults={'expected_default_sessions': 3, 'base_price': 3000.00, 'consultation_required': True}
    )
    print("Procedure Masters created.")

    # 4. Procedure Rooms
    room1, _ = ProcedureRoom.objects.get_or_create(
        organization=org, name='Laser Room A', defaults={'is_active': True}
    )
    room2, _ = ProcedureRoom.objects.get_or_create(
        organization=org, name='Treatment Room 1', defaults={'is_active': True}
    )

    # 5. Medicine & Lab Test Masters
    med1, _ = MedicineMaster.objects.get_or_create(
        organization=org, brand_name='Amoxil 500mg', 
        defaults={'generic_name': 'Amoxicillin', 'strength': '500mg', 'form': 'TABLET'}
    )
    med2, _ = MedicineMaster.objects.get_or_create(
        organization=org, brand_name='Retin-A 0.05%', 
        defaults={'generic_name': 'Tretinoin', 'strength': '0.05%', 'form': 'CREAM'}
    )
    
    lab1, _ = LabTestMaster.objects.get_or_create(
        organization=org, name='Complete Blood Count (CBC)'
    )
    print("Medicine & Lab Masters created.")

    # 6. Inventory Masters
    skincare_prod_cat, _ = ProductCategory.objects.get_or_create(
        organization=org, name='Retail Skincare'
    )
    uom_pcs, _ = UnitOfMeasure.objects.get_or_create(
        organization=org, name='Pieces', abbreviation='pcs'
    )
    
    prod1, _ = Product.objects.get_or_create(
        organization=org, sku='SKU-CLEANSER-01', name='Gentle Foaming Cleanser 150ml',
        defaults={
            'category': skincare_prod_cat, 'uom': uom_pcs,
            'is_saleable': True, 'product_type': 'SKINCARE',
            'sale_price': 1500.00, 'cost_price': 800.00
        }
    )
    prod2, _ = Product.objects.get_or_create(
        organization=org, sku='SKU-BOTOX-VIAL', name='Botox Vial 100u',
        defaults={
            'category': skincare_prod_cat, 'uom': uom_pcs,
            'is_saleable': False, 'product_type': 'CONSUMABLE',
            'sale_price': 0, 'cost_price': 12000.00
        }
    )
    
    # Stock Location & Initial Stock
    main_store, _ = StockLocation.objects.get_or_create(
        organization=org, name='Main Storage'
    )
    
    StockItem.objects.update_or_create(
        organization=org, location=main_store, product=prod1,
        defaults={'quantity': 50}
    )
    StockItem.objects.update_or_create(
        organization=org, location=main_store, product=prod2,
        defaults={'quantity': 20}
    )
    print("Inventory Products and Stock created.")
    
    print("\n--- TEST DATA SEEDING COMPLETE ---")
    print(f"You can log in as Doctor: username='drsmith', password='password123'")

if __name__ == '__main__':
    seed_data()
