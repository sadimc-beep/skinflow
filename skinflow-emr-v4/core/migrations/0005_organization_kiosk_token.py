import uuid
from django.db import migrations, models


def populate_kiosk_tokens(apps, schema_editor):
    Organization = apps.get_model('core', 'Organization')
    for org in Organization.objects.all():
        org.kiosk_token = uuid.uuid4()
        org.save(update_fields=['kiosk_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_clinicstaff_is_org_admin_organization_is_active_and_more'),
    ]

    operations = [
        # Step 1: add nullable (no unique constraint yet)
        migrations.AddField(
            model_name='organization',
            name='kiosk_token',
            field=models.UUIDField(null=True, editable=False),
        ),
        # Step 2: populate each existing row with a unique UUID
        migrations.RunPython(populate_kiosk_tokens, migrations.RunPython.noop),
        # Step 3: make it non-nullable and unique
        migrations.AlterField(
            model_name='organization',
            name='kiosk_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
