from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounting', '0001_initial'),
        ('core', '0007_provider_default_consultation_fee'),
    ]

    operations = [
        migrations.AddField(
            model_name='clinicsettings',
            name='default_consultation_revenue_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Revenue account for consultation fees',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_procedure_revenue_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Revenue account for procedure sessions',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_product_revenue_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Revenue account for product / pharmacy sales',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_product_cogs_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='COGS account debited when products are fulfilled from stock',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_procedure_cogs_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='COGS account debited when consumables are issued via requisition',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_cash_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Asset account for cash payments received',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_bank_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Asset account for card / bank transfer payments',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_bkash_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Asset account for bKash payments',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_nagad_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Asset account for Nagad payments',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
        migrations.AlterField(
            model_name='clinicsettings',
            name='default_revenue_account',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Generic revenue fallback (used if granular accounts not set)',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='accounting.account',
            ),
        ),
    ]
