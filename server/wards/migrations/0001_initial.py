from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Ward',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('department', models.CharField(max_length=100)),
                ('floor', models.IntegerField()),
                ('total_beds', models.IntegerField()),
                ('nurse_in_charge', models.CharField(max_length=100)),
                ('status', models.CharField(default='active', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'wards',
            },
        ),
        migrations.CreateModel(
            name='Bed',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.CharField(max_length=10)),
                ('status', models.CharField(choices=[('available', 'Available'), ('occupied', 'Occupied'), ('maintenance', 'Maintenance'), ('cleaning', 'Cleaning')], default='available', max_length=20)),
                ('admission_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('ward', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='beds', to='wards.ward')),
            ],
            options={
                'db_table': 'beds',
            },
        ),
        migrations.AlterUniqueTogether(
            name='bed',
            unique_together={('ward', 'number')},
        ),
    ]