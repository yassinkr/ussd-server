const { SerialPort } = require('serialport');

async function listSerialPorts() {
  console.log('Attempting to list serial ports...');
  try {
    const ports = await SerialPort.list();
    if (ports.length === 0) {
      console.log('No serial ports found.');
    } else {
      ports.forEach(port => {
        console.log(`Port: ${port.path}, Manufacturer: ${port.manufacturer}`);
      });
    }
  } catch (err) {
    console.error('Error listing serial ports:', err);
  }
}

listSerialPorts();
