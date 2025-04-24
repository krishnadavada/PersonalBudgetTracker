function limitValidate(nDailyLimit,nWeeklyLimit,nMonthlyLimit){
    if (
        nDailyLimit >= nWeeklyLimit ||
        nDailyLimit >= nMonthlyLimit ||
        nWeeklyLimit >= nMonthlyLimit ||
        nDailyLimit < 0 ||
        nWeeklyLimit < 0 ||
        nMonthlyLimit < 0
      ) {
        return true
      }
}

module.exports={limitValidate}