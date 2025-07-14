package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class StatsScheduler {

    private final StatsCalculationService statsCalculationService;

    public StatsScheduler(StatsCalculationService statsCalculationService) {
        this.statsCalculationService = statsCalculationService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void runDailyStatsJob() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        statsCalculationService.calculateStatsFromData(yesterday);
    }
}
