const app = require('./app');
const connectDB = require('./config/db');
const { port, nodeEnv } = require('./config/env');
const Doctor = require('./models/Doctor');

// Seed default admin and demo doctors
const seedDefaultUsers = async () => {
  try {
    // Check if admin exists
    const adminExists = await Doctor.findOne({ user_id: 'admin_hospital' });
    if (!adminExists) {
      await Doctor.create({
        doctor_id: 'DOC-ADMIN-001',
        doctor_name: 'Hospital Admin',
        user_id: 'admin_hospital',
        password: 'admin123',
        doctor_speciality: 'Administration',
        role: 'admin'
      });
      console.log('Default admin user created');
    }

    // Check if demo doctors exist
    const cardiologyDoc = await Doctor.findOne({ user_id: 'dr_cardiology' });
    if (!cardiologyDoc) {
      await Doctor.create({
        doctor_id: 'DOC-CARDIO-001',
        doctor_name: 'Dr. Sarah Johnson',
        user_id: 'dr_cardiology',
        password: 'doctor123',
        doctor_speciality: 'Cardiology',
        role: 'doctor'
      });
      console.log('Demo cardiology doctor created');
    }

    const neuroDoc = await Doctor.findOne({ user_id: 'dr_neuro' });
    if (!neuroDoc) {
      await Doctor.create({
        doctor_id: 'DOC-NEURO-001',
        doctor_name: 'Dr. Michael Chen',
        user_id: 'dr_neuro',
        password: 'doctor123',
        doctor_speciality: 'Neurology',
        role: 'doctor'
      });
      console.log('Demo neurology doctor created');
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
};

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Seed default users
    await seedDefaultUsers();

    // Start server
    app.listen(port, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║     Hospital Management System API Server         ║
╠═══════════════════════════════════════════════════╣
║  Status:      Running                             ║
║  Port:        ${port.toString().padEnd(37)}║
║  Environment: ${nodeEnv.padEnd(37)}║
║  API Base:    http://localhost:${port}/api${' '.repeat(16)}║
╚═══════════════════════════════════════════════════╝

Available Endpoints:
  POST   /api/auth/login
  GET    /api/auth/verify
  
  GET    /api/patients
  POST   /api/patients
  GET    /api/patients/:id
  PUT    /api/patients/:id
  DELETE /api/patients/:id
  
  GET    /api/doctors
  POST   /api/doctors
  GET    /api/doctors/:id
  PUT    /api/doctors/:id
  DELETE /api/doctors/:id
  
  GET    /api/visits
  POST   /api/visits
  GET    /api/visits/:id
  PUT    /api/visits/:id
  DELETE /api/visits/:id
  GET    /api/visits/severity-trend/:patientId
  
  GET    /api/prescriptions
  POST   /api/prescriptions
  GET    /api/prescriptions/:id
  PUT    /api/prescriptions/:id
  DELETE /api/prescriptions/:id
  
  POST   /api/upload/patients
  POST   /api/upload/visits
  POST   /api/upload/prescriptions

Demo Credentials:
  Admin:  user_id: admin_hospital / password: admin123
  Doctor: user_id: dr_cardiology  / password: doctor123
  Doctor: user_id: dr_neuro       / password: doctor123
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
