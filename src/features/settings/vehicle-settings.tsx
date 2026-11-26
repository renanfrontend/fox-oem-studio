import { Field } from '@/components/shared/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AcquisitionStatus, VehicleProfile } from '@/domain/types';
import { useAppStore } from '@/store/app-store';

const ACQUISITION_OPTIONS: { id: AcquisitionStatus; label: string; hint: string }[] = [
  { id: 'pesquisando', label: 'Pesquisando', hint: 'Ainda comparando anúncios.' },
  { id: 'negociando', label: 'Em negociação', hint: 'Laudo e vistoria em andamento.' },
  { id: 'comprado', label: 'Comprado', hint: 'O valor do carro sai do saldo do Cofrinho.' },
];

function isAcquisition(value: string): value is AcquisitionStatus {
  return ACQUISITION_OPTIONS.some((option) => option.id === value);
}

const TEXT_FIELDS: { key: keyof Pick<VehicleProfile, 'nickname' | 'model' | 'modelYear' | 'color' | 'engine' | 'transmission' | 'plate'>; label: string }[] = [
  { key: 'nickname', label: 'Apelido' },
  { key: 'model', label: 'Modelo' },
  { key: 'modelYear', label: 'Ano/modelo' },
  { key: 'color', label: 'Cor' },
  { key: 'engine', label: 'Motor' },
  { key: 'transmission', label: 'Câmbio' },
  { key: 'plate', label: 'Placa (opcional)' },
];

export function VehicleSettings() {
  const vehicle = useAppStore((state) => state.vehicle);
  const updateVehicle = useAppStore((state) => state.updateVehicle);
  const current = ACQUISITION_OPTIONS.find((option) => option.id === vehicle.acquisitionStatus);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status da aquisição" htmlFor="vehicle-status" hint={current?.hint}>
          <Select
            value={vehicle.acquisitionStatus}
            onValueChange={(value) => {
              if (isAcquisition(value)) updateVehicle({ acquisitionStatus: value });
            }}
          >
            <SelectTrigger id="vehicle-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACQUISITION_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Data da compra" htmlFor="vehicle-purchase">
          <Input
            id="vehicle-purchase"
            type="date"
            value={vehicle.purchaseDate ?? ''}
            onChange={(event) => updateVehicle({ purchaseDate: event.target.value || null })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((field) => (
          <Field key={field.key} label={field.label} htmlFor={`vehicle-${field.key}`}>
            <Input
              id={`vehicle-${field.key}`}
              value={vehicle[field.key]}
              onChange={(event) => updateVehicle({ [field.key]: event.target.value })}
              autoCapitalize={field.key === 'plate' ? 'characters' : undefined}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}
