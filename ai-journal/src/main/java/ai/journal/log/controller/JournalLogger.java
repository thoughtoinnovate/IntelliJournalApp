package ai.journal.log.controller;


import ai.journal.log.entities.JournalLog;
import ai.journal.log.entities.Journal;
import ai.journal.log.service.JournalFileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/journal")
@CrossOrigin(origins = "*")
public class JournalLogger {

    private final JournalFileService journalFileService;


    public JournalLogger(JournalFileService journalFileService) {
        this.journalFileService = journalFileService;
    }

    @PostMapping("/logs")
    public Journal createConversation(@RequestBody Journal request) {

        return journalFileService.saveToFile(request);
    }

    @PatchMapping("/log/{journalId}")
    public Journal addConversation(@PathVariable String journalId, @RequestBody JournalLog request) {
        try {
            return journalFileService.appendConversation(UUID.fromString(journalId), request);
        } catch (FileNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/logs/{journalId}")
    public Journal getConversation(@PathVariable String journalId) {
        try {
            return journalFileService.readConversation(UUID.fromString(journalId));
        } catch (FileNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/all")
    public List<Journal> getAllConversations() {
        return journalFileService.readAllJournals();
    }

    @DeleteMapping("/{journalId}")
    public ResponseEntity<Void> deleteJournal(@PathVariable String journalId) {
        try {
            journalFileService.deleteJournal(UUID.fromString(journalId));
            return ResponseEntity.ok().build();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/log/{journalId}")
    public Journal replaceJournalLogs(@PathVariable String journalId, @RequestBody JournalLog newLog) {
        try {
            return journalFileService.updateJournalLog(UUID.fromString(journalId), newLog);
        } catch (FileNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/logs/{journalId}/logs")
    public Journal deleteMultipleLogs(@PathVariable String journalId, @RequestBody List<String> logIds) {
        try {
            Set<UUID> uuidLogIds = logIds.stream().map(UUID::fromString).collect(Collectors.toSet());
            return journalFileService.deleteMultipleLogs(UUID.fromString(journalId), uuidLogIds);
        } catch (FileNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }


    @GetMapping("/logs/reminders")
    public List<Journal> getJournalsWithReminders(@RequestParam(defaultValue = "false") boolean futureOnly) {
        return journalFileService.getJournalsWithReminders(futureOnly);
    }

    // In JournalLogger.java

    @DeleteMapping("/{journalId}/logs/reminder/{logId}")
    public Journal unsetReminderFromLog(@PathVariable String journalId, @PathVariable String logId) {
        try {
            return journalFileService.unsetReminderFromLog(UUID.fromString(journalId), UUID.fromString(logId));
        } catch (FileNotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}