function calculateTeenData(data) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = January, 11 = December
  let currentGrade = currentYear - data.gradYear + 12;

  if (currentGrade > 12 || (currentGrade === 12 && currentMonth >= 6)) {
    currentGrade = "Graduated";
  }

  let confirmationYear = currentYear;
  if (currentMonth >= 6) {
    // After June (July to December)
    confirmationYear += 12 - parseInt(data.confirmationLevel);
  } else {
    confirmationYear += 11 - parseInt(data.confirmationLevel);
  }

  return {
    ...data,
    currentGrade,
    confirmationYear,
  };
}

module.exports = calculateTeenData;
