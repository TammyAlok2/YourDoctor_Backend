// schema.js
import { Schema, model } from 'mongoose';

const slotSchema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required:true,
  },
  date: {
    type: String,
    required: true,
    trim:true,
    
  },
  slots: [
    {
      startTime: {
        type: String,
        required: true,
        trim:true,
      },
      endTime: {
        type: String,
        required: true,
        trim:true,
      },
      availableSlot: {
        type: Number,
        trim:true,
        
    
      },
      slotSize:{
        type:Number,
        
      },

      patients: [
        {
          patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
          },
          patientName: String,
          patientPhone: String,
        },
      ],
    
    }
  ]
});

const DoctorSchedule = model('SlotSchema', slotSchema);

export default DoctorSchedule