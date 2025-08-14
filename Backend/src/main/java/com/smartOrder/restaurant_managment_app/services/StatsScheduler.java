package com.smartOrder.restaurant_managment_app.services;

import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task for daily statistics calculation.
 * Runs at midnight to process yesterday's data.
 */
@Component
public class StatsScheduler {

    private final StatsCalculationService statsCalculationService;

    public StatsScheduler(StatsCalculationService statsCalculationService) {
        this.statsCalculationService = statsCalculationService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void runDailyStatsJob() {
        statsCalculationService.calculateStatsFromData(LocalDate.now().minusDays(1));
    }
}