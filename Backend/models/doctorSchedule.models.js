// schema.js
import { Schema, model } from 'mongoose';

const slotSchema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required:true,
  },
  date: {
    type: Date,
    required: true
  },
  slots: [
    {
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      availableSlot: {
        type: Number,
        
    
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