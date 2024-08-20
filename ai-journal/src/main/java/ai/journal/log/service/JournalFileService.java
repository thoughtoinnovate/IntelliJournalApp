package ai.journal.log.service;


import ai.journal.log.entities.JournalLog;
import ai.journal.log.entities.Journal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;

@Service
public class JournalFileService {

    @Value("${journal.home-folder:ai-journal}")
    private String homeFolder;

    @Value("${journal.path}")
    private String journalPath;

    @Value("${journal.file-extension:.journal}")
    private String fileExtension;

    @PostConstruct
    public void init() {
        try {
            Path path = Paths.get(journalPath, "ai-journal");
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
            refreshCache();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create directory", e);
        }
    }


    private final String pattern = "yyyy-MMMM-dd HH:mm:ss";
    //    private final SimpleModule module = new JavaTimeModule().addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(pattern))).addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern(pattern)));
    private final SimpleModule module = new JavaTimeModule();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(module).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    ;
    private final Set<UUID> journalIdsCache = new HashSet<>();

    public void refreshCache() {
        journalIdsCache.clear();
        List<Journal> allJournals = readAllJournals();
        for (Journal journal : allJournals) {
            journalIdsCache.add(journal.getId());
        }
    }

    private UUID generateUniqueID() {
        UUID newId;
        do {
            newId = UUID.randomUUID();
        } while (journalIdsCache.contains(newId));

        return newId;
    }

    public Journal saveToFile(@NonNull Journal journal) {

        journal.setId(generateUniqueID());
        ZonedDateTime now = ZonedDateTime.now();
        journal.setCreatedDate(now);
        journal.setUpdatedDate(now);

        for (JournalLog journalLog : journal.getJournalLogs()) {
            journalLog.setCreatedOn(now);
            journalLog.setUpdatedOn(now);
            journalLog.setId(UUID.randomUUID());
        }

        String filename = Paths.get(journalPath, homeFolder, journal.getId().toString().concat(fileExtension)).toString();

        try {

            File file = new File(filename);
            if (file.exists()) {
                throw new RuntimeException("Conversation already exists!");
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(journal));
                return journal;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to append to file", e);
        }
    }


    public Journal appendConversation(@NonNull UUID journalId, JournalLog journalLog) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();

        try {

            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("Conversation does not exist!");
            }

            Journal existingData = objectMapper.readValue(file, Journal.class);

            ZonedDateTime now = ZonedDateTime.now();

            existingData.setUpdatedDate(now);

            journalLog.setCreatedOn(now);
            journalLog.setUpdatedOn(now);
            existingData.addJournalLog(journalLog);

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(existingData));
                return existingData;
            }
        } catch (FileNotFoundException ex) {
            throw ex;
        } catch (IOException e) {
            throw new RuntimeException("Failed to append to file", e);
        }
    }

    public Journal readConversation(@NonNull UUID journalId) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();


        try {
            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("journal does not exist!");
            }

            return objectMapper.readValue(file, Journal.class);
        } catch (FileNotFoundException ex) {
            throw ex;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read from file", e);
        }
    }

    public List<Journal> readAllJournals() {
        File folder = new File(journalPath, homeFolder);
        File[] listOfFiles = folder.listFiles();
        List<Journal> allConversations = new ArrayList<>();

        assert listOfFiles != null;
        for (File file : listOfFiles) {
            if (file.isFile() && file.getName().endsWith(fileExtension)) {
                try {
                    Journal journal = objectMapper.readValue(file, Journal.class);
                    allConversations.add(journal);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to read from file", e);
                }
            }
        }

        return allConversations;
    }

    public void deleteJournal(@NonNull UUID journalId) throws IOException {
        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();
        File file = new File(filename);
        if (file.exists()) {
            if (!file.delete()) {
                throw new IOException("Failed to delete file");
            }
            journalIdsCache.remove(journalId);
        } else {
            throw new FileNotFoundException("Journal does not exist");
        }
    }

    public Journal updateJournalLog(@NonNull UUID journalId, JournalLog updatedLog) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();

        try {
            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("Journal does not exist");
            }

            Journal existingJournal = objectMapper.readValue(file, Journal.class);

            // Find the log to be updated and replace it with the updated log
            ZonedDateTime now = ZonedDateTime.now();

            updatedLog.setUpdatedOn(now);
            existingJournal.getJournalLogs().remove(updatedLog);
            existingJournal.getJournalLogs().add(updatedLog);

            // Save the updated journal back to the file system
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(existingJournal));
                return existingJournal;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to update journal log", e);
        }
    }

    public Journal deleteMultipleLogs(@NonNull UUID journalId, Set<UUID> logIds) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();

        try {
            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("Journal does not exist");
            }

            Journal existingJournal = objectMapper.readValue(file, Journal.class);

            // Remove the logs with the specified IDs
            existingJournal.getJournalLogs().removeIf(log -> logIds.contains(log.getId()));

            // Save the updated journal back to the file system
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(existingJournal));
                return existingJournal;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete logs", e);
        }
    }

    public Journal updateJournalLogReminder(@NonNull UUID journalId, UUID logId, JournalLog logWithReminder) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();

        try {
            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("Journal does not exist");
            }

            Journal existingJournal = objectMapper.readValue(file, Journal.class);

            // Find the log to be updated
            Optional<JournalLog> optionalLog = existingJournal.getJournalLogs().stream().filter(log -> log.getId().equals(logId)).findFirst();

            if (!optionalLog.isPresent()) {
                throw new FileNotFoundException("JournalLog does not exist");
            }

            JournalLog existingLog = optionalLog.get();

            // Update the log's reminder fields
            existingLog.setReminderNeeded(logWithReminder.isReminderNeeded());
            existingLog.setReminderDate(logWithReminder.getReminderDate());

            // Save the updated journal back to the file system
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(existingJournal));
                return existingJournal;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to update journal log reminder", e);
        }
    }

    public List<Journal> getJournalsWithReminders(boolean futureOnly) {

        List<Journal> allJournals = readAllJournals();


        return allJournals.stream().map(journal -> {
            // Create a new Journal that is a copy of the current Journal
            Journal newJournal = Journal.builder().id(journal.getId()).name(journal.getName()).createdDate(journal.getCreatedDate()).updatedDate(journal.getUpdatedDate()).build();
            // Filter the JournalLogs of the current Journal and set them in the new Journal
            Set<JournalLog> filteredJournalLogs = journal.getJournalLogs().stream().map(Objects::requireNonNull).filter(log->log.isReminderNeeded() && Optional.of(log.getReminderDate()).isPresent()).filter(futureOnly ? log -> log.getReminderDate().isAfter(ZonedDateTime.now()) : log -> log.getReminderDate().isBefore(ZonedDateTime.now())).collect(Collectors.toSet());
            newJournal.setJournalLogs(filteredJournalLogs);

            return newJournal;
        }).collect(Collectors.toList());

    }

    // In JournalFileService.java

    public Journal unsetReminderFromLog(@NonNull UUID journalId, UUID logId) throws FileNotFoundException {

        String filename = Paths.get(journalPath, homeFolder, journalId.toString().concat(fileExtension)).toString();

        try {
            File file = new File(filename);
            if (!file.exists()) {
                throw new FileNotFoundException("Journal does not exist");
            }

            Journal existingJournal = objectMapper.readValue(file, Journal.class);

            // Find the log to be updated
            Optional<JournalLog> optionalLog = existingJournal.getJournalLogs().stream().filter(log -> log.getId().equals(logId)).findFirst();

            if (!optionalLog.isPresent()) {
                throw new FileNotFoundException("JournalLog does not exist");
            }

            JournalLog existingLog = optionalLog.get();

            // Unset the log's reminder fields
            existingLog.setReminderNeeded(false);
            existingLog.setReminderDate(null);

            // Save the updated journal back to the file system
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(filename))) {
                writer.write(objectMapper.writeValueAsString(existingJournal));
                return existingJournal;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to unset journal log reminder", e);
        }
    }
}
