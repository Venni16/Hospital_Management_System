from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InventoryItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('category', models.CharField(choices=[('medication', 'Medication'), ('medical_supplies', 'Medical Supplies'), ('equipment', 'Equipment'), ('consumables', 'Consumables')], max_length=20)),
                ('quantity', models.IntegerField()),
                ('unit', models.CharField(max_length=20)),
                ('min_stock', models.IntegerField()),
                ('supplier', models.CharField(max_length=100)),
                ('expiry_date', models.DateField()),
                ('cost_per_unit', models.DecimalField(decimal_places=2, max_digits=10)),
                ('location', models.CharField(max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'inventory_items',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='InventoryTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transaction_type', models.CharField(choices=[('in', 'Stock In'), ('out', 'Stock Out'), ('adjustment', 'Adjustment')], max_length=20)),
                ('quantity', models.IntegerField()),
                ('reason', models.CharField(max_length=200)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='inventory.inventoryitem')),
                ('performed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'inventory_transactions',
                'ordering': ['-date'],
            },
        ),
    ]