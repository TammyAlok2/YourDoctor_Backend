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

      
    
    }
  ]
});

const DoctorSchedule = model('DoctorSchedule', slotSchema);

const leaveSchema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  }
});

const DoctorLeave = model('DoctorLeave', leaveSchema);

export { DoctorSchedule, DoctorLeave };