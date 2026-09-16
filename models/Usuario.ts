export interface Usuario {

  uid: string;

  nombre: string;

  edad: number;

  peso: number;

  altura: number;

  genero: string;

  enfermedades: string[];

  alergias: string[];

  grupoSanguineo: string;

  fuma: boolean;

  alcohol: boolean;

  actividadFisica: string;

  horasSueno: number;

  createdAt?: Date;

  updatedAt?: Date;

}