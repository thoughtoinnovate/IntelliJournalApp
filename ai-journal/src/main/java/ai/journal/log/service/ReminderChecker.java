package ai.journal.log.service;

import ai.journal.log.entities.JournalLog;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class ReminderChecker {

    private final JournalFileService journalFileService;
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final SimpleModule module = new JavaTimeModule();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(module).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    ;

    @Value("${reminder.time.before}")
    private long timeBefore;

    public ReminderChecker(JournalFileService journalFileService) {
        this.journalFileService = journalFileService;
    }

    public void registerSession(WebSocketSession session) {
        sessions.add(session);
    }

    @Scheduled(cron = "${reminder.cron.expression}")
    public void checkReminders() {
        ZonedDateTime now = ZonedDateTime.now();
        ZonedDateTime reminderScanWindow = now.plusMinutes(timeBefore);

        System.out.println("Checking reminders at " + now + " and for reminders In minutes :" + reminderScanWindow);
        journalFileService.readAllJournals().stream()
                .flatMap(journal -> journal.getJournalLogs().stream())
                .filter(log -> log.isReminderNeeded() && !log.getReminderDate().isBefore(now) && log.getReminderDate().isBefore(reminderScanWindow))
                .forEach(this::sendReminder);
    }

    private void sendReminder(JournalLog log) {
        try {
            System.out.println("Sending reminder for log " + log.getId() + ": " + log.getMessage());
            String jsonMessage = objectMapper.writeValueAsString(log);
            TextMessage message = new TextMessage(jsonMessage);
            Iterator<WebSocketSession> sessionIterator = sessions.iterator();
            while (sessionIterator.hasNext()) {
                WebSocketSession session = sessionIterator.next();
                try {
                    session.sendMessage(message);
                } catch (IOException | IllegalStateException e) {
                    // This session has been closed or there was an error. Remove it from the list.
                    sessions.remove(session);
                }
            }
        } catch (JsonProcessingException e) {
            System.out.println("Error converting log to JSON: " + e.getMessage());
        }
    }

    private void sendReminder2(String message) {
        try {
            System.out.println("Sending reminder for log " + message);
            TextMessage tm = new TextMessage(message);
            Iterator<WebSocketSession> sessionIterator = sessions.iterator();
            while (sessionIterator.hasNext()) {
                WebSocketSession session = sessionIterator.next();
                try {
                    session.sendMessage(tm);
                } catch (IOException | IllegalStateException e) {
                    // This session has been closed or there was an error. Remove it from the list.
                    sessions.remove(session);
                }
            }
        } catch (Exception e) {
            System.out.println("Error converting log to JSON: " + e.getMessage());
        }
    }
}
