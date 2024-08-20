package ai.journal.log.controller;

import ai.journal.log.service.ReminderChecker;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@RestController
@CrossOrigin(origins = "*")
public class WebSocketController extends TextWebSocketHandler {

    private final ReminderChecker reminderChecker;

    public WebSocketController(ReminderChecker reminderChecker) {
        this.reminderChecker = reminderChecker;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        reminderChecker.registerSession(session);
    }
}