import {buildCar} from './car';
import {getVehicle,type Vehicle} from '../data/vehicles';
export function build(_ratio=9,vehicle:Vehicle=getVehicle('model3')){return buildCar(vehicle);}
