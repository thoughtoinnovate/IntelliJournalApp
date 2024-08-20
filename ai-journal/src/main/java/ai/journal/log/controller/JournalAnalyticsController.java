package ai.journal.log.controller;

import ai.journal.LLMUtils;
import ai.journal.log.entities.Journal;
import ai.journal.log.service.JournalFileService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

import java.io.FileNotFoundException;
import java.time.ZonedDateTime;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/journal")
public class JournalAnalyticsController {

    private final JournalFileService journalFileService;
    private final String pattern = "yyyy-MMMM-dd HH:mm:ss";
    private final LLMUtils llmUtils;
    private final ObjectMapper journalObjectMapper;


    public JournalAnalyticsController(JournalFileService journalFileService, LLMUtils llmUtils, ObjectMapper journalObjectMapper) {
        this.journalFileService = journalFileService;
        this.llmUtils = llmUtils;
        this.journalObjectMapper = journalObjectMapper;
    }


    @GetMapping("/analytics/{journalId}")
    public Flux<String> generateStream(@PathVariable String journalId, @RequestParam String aiPrompt, @RequestParam(required = false) String model, @RequestParam(required = false) String respFormat) {


        System.out.println("Journal ID: " + journalId + " AI Prompt: " + aiPrompt + " Model: " + model);

        respFormat = (StringUtils.isNotEmpty(respFormat) ? respFormat.toUpperCase() : "TEXT");

        try {
            Journal journal = journalFileService.readConversation(UUID.fromString(journalId));
            String context = journalObjectMapper.writeValueAsString(journal);
            ZonedDateTime now = ZonedDateTime.now();
            final String finalQuery = "[CAPITALS ARE INSTRUCTIONS TO LLM, RESPONSE EXPECTED IN " + respFormat + "]\nCURRENT DATE:" + now + "\nCONTEXT IN JSON : /start/\n " + context + "\n/end/\nQUERY: " + aiPrompt.toUpperCase();
            System.out.println(finalQuery);
            return llmUtils.getOllamaChatModel(model).stream(finalQuery);

        } catch (FileNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}