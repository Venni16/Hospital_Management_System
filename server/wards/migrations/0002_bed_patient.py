from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0001_initial'),
        ('wards', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bed',
            name='patient',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='patients.patient'),
        ),
    ]