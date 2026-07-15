import prisma from '../config/prisma.js';

/**
 * AI Forecasting Logic
 * Menggunakan Simple Moving Average (SMA) 3 bulan ke belakang
 * untuk memprediksi kebutuhan material berdasarkan MaterialLog (type: OUT)
 */
export const getForecast = async (req, res, next) => {
  try {
    const { materialId } = req.query; // Prediksi per material
    
    if (!materialId) {
      return res.status(400).json({ success: false, message: 'materialId is required' });
    }

    // Ambil data 3 bulan terakhir (log pengeluaran)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const logs = await prisma.materialLog.findMany({
      where: {
        materialId: parseInt(materialId),
        type: 'OUT',
        createdAt: { gte: threeMonthsAgo }
      }
    });

    // Hitung total pengeluaran
    const totalOut = logs.reduce((sum, log) => sum + log.quantity, 0);
    const averageOut = totalOut / 3; 

    res.json({
      success: true,
      data: {
        materialId: parseInt(materialId),
        algorithm: 'Simple Moving Average (SMA-3)',
        historicalTotalOut: totalOut,
        forecastNextMonth: Math.round(averageOut * 100) / 100, 
        unit: 'pcs/unit'
      }
    });
  } catch (error) {
    next(error);
  }
};
