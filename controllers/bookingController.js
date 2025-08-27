const { Booking, Equipment } = require('../models');

const getAllBookings = async (req, res) => {
  try {
    const { userId, owner } = req.query;
    let filter = {};
    if (userId) {
      filter.userId = userId;
    }
    if (owner) {
      filter.owner = owner; 
    }
    const bookings = await Booking.find(filter)
      .populate('equipmentId')
      .populate('userId', 'name email phone')
      .populate('owner', 'name email');
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { 
      userId, 
      equipmentId, 
      startDate, 
      endDate, 
      totalAmount
    } = req.body;

    // Always reload equipment from DB to get latest availability
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    console.log(`Booking request for equipment: ${equipment.name} (ID: ${equipment._id}) | Available: ${equipment.available} / ${equipment.quantity}`);
    if (equipment.available <= 0) {
      console.log('Booking blocked: Equipment not available');
      return res.status(400).json({ message: 'Equipment is not available for booking' });
    }

    // Create booking
    const booking = new Booking({
      userId,
      equipmentId,
      owner: equipment.owner,
      startDate,
      endDate,
      totalAmount,
      status: 'pending'
    });

    await booking.save();

    // Update equipment availability
    equipment.available -= 1;
    await equipment.save();
    console.log(`Booking successful. Equipment availability after booking: ${equipment.available} / ${equipment.quantity}`);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking' });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const { ownerId } = req.body;
    console.log('Accept booking request:', { bookingId: req.params.id, ownerId });
    
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    
    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking found:', { bookingOwner: booking.owner.toString(), requestOwnerId: ownerId });

    if (booking.owner.toString() !== ownerId) {
      console.log('Access denied: Owner mismatch');
      return res.status(403).json({ message: 'Access denied: You can only manage bookings for your equipment' });
    }

    if (booking.status !== 'pending') {
      console.log('Invalid status for acceptance:', booking.status);
      return res.status(400).json({ message: 'Only pending bookings can be accepted' });
    }

    booking.status = 'confirmed';
    await booking.save();
    console.log('Booking accepted successfully');

    res.json({ message: 'Booking accepted successfully', booking });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ message: 'Error accepting booking', error: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { ownerId } = req.body;
    console.log('Reject booking request:', { bookingId: req.params.id, ownerId });
    
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    
    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.owner.toString() !== ownerId) {
      console.log('Access denied: Owner mismatch for rejection');
      return res.status(403).json({ message: 'Access denied: You can only manage bookings for your equipment' });
    }

    if (booking.status !== 'pending') {
      console.log('Invalid status for rejection:', booking.status);
      return res.status(400).json({ message: 'Only pending bookings can be rejected' });
    }

    booking.status = 'rejected';
    await booking.save();

    // Free up equipment when booking is rejected
    const equipment = await Equipment.findById(booking.equipmentId);
    if (equipment && equipment.available < equipment.quantity) {
      equipment.available += 1;
      await equipment.save();
      console.log(`Equipment freed up after rejection. New availability: ${equipment.available}/${equipment.quantity}`);
    }

    res.json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'Error rejecting booking', error: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const { ownerId } = req.body;
    console.log('Complete booking request:', { bookingId: req.params.id, ownerId });
    
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    
    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.owner.toString() !== ownerId) {
      console.log('Access denied: Owner mismatch for completion');
      return res.status(403).json({ message: 'Access denied: You can only manage bookings for your equipment' });
    }

    if (booking.status !== 'confirmed') {
      console.log('Invalid status for completion:', booking.status);
      return res.status(400).json({ message: 'Only confirmed bookings can be marked as completed' });
    }

    booking.status = 'completed';
    await booking.save();

    // Free up equipment when rental is completed
    const equipment = await Equipment.findById(booking.equipmentId);
    if (equipment && equipment.available < equipment.quantity) {
      equipment.available += 1;
      await equipment.save();
      console.log(`Equipment returned and available. New availability: ${equipment.available}/${equipment.quantity}`);
    }

    res.json({ message: 'Booking marked as completed successfully', booking });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ message: 'Error completing booking', error: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { status, ownerId } = req.body;
    const booking = await Booking.findById(req.params.id).populate('equipmentId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the requester is the owner (for status changes like accept/reject)
    if (ownerId && booking.owner.toString() !== ownerId) {
      return res.status(403).json({ message: 'Access denied: You can only manage bookings for your equipment' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Handle equipment availability changes
    if (status === 'cancelled' || status === 'rejected') {
      // Free up equipment when booking is cancelled or rejected
      let equipmentId = booking.equipmentId;
      if (!equipmentId && booking.equipment) equipmentId = booking.equipment;
      if (equipmentId) {
        const equipment = await Equipment.findById(equipmentId);
        if (equipment && equipment.available < equipment.quantity) {
          equipment.available += 1;
          await equipment.save();
          console.log(`Equipment freed up. New availability: ${equipment.available}/${equipment.quantity}`);
        }
      }
    } else if (status === 'completed') {
      // Mark equipment as available again when rental is completed
      let equipmentId = booking.equipmentId;
      if (!equipmentId && booking.equipment) equipmentId = booking.equipment;
      if (equipmentId) {
        const equipment = await Equipment.findById(equipmentId);
        if (equipment && equipment.available < equipment.quantity) {
          equipment.available += 1;
          await equipment.save();
          console.log(`Equipment returned and available. New availability: ${equipment.available}/${equipment.quantity}`);
        }
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
};

module.exports = {
  getAllBookings,
  createBooking,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  updateBooking
};
