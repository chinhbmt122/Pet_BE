const { Account } = require('./src/entities/account.entity');
const { Manager } = require('./src/entities/manager.entity');
const { Receptionist } = require('./src/entities/receptionist.entity');
const { CareStaff } = require('./src/entities/care-staff.entity');
const { Veterinarian } = require('./src/entities/veterinarian.entity');

console.log('Account:', typeof Account);
console.log('Manager:', typeof Manager);
console.log('Receptionist:', typeof Receptionist);
console.log('CareStaff:', typeof CareStaff);
console.log('Veterinarian:', typeof Veterinarian);