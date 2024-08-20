package ai.journal.llm.controllers;


import ai.journal.LLMUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RestController
@CrossOrigin(origins = "*")
public class Interact {

    private final RestTemplate ollamaRESTClient;
    private final LLMUtils llmUtils;

    public Interact(RestTemplate ollamaRESTClient, LLMUtils llmUtils) {
        this.ollamaRESTClient = ollamaRESTClient;
        this.llmUtils = llmUtils;
    }


    @GetMapping("/ollama/models")
    public List<String> getOllamaModel() {
        String response = Objects.requireNonNull(ollamaRESTClient.getForObject("/api/tags", String.class));

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root;
        try {
            root = mapper.readTree(response);
        } catch (IOException e) {
            throw new RuntimeException("Error parsing JSON response", e);
        }

        JsonNode modelsNode = root.path("models");
        if (modelsNode.isMissingNode()) {
            throw new RuntimeException("The 'models' field is missing in the JSON response");
        }

        List<String> models = new ArrayList<>();
        if (modelsNode.isArray()) {
            for (JsonNode node : modelsNode) {
                models.add(node.get("name").asText());
            }
        }

        return models;
    }

    @GetMapping("/ai/generateStream")
    public Flux<String> generateStream(@RequestParam(defaultValue = "Tell me a joke") String aiPrompt, @RequestParam(required = false) String model, @RequestParam(required = false) String respFormat) {


        System.out.println("AI Prompt: " + aiPrompt + " Model: " + model);

        ZonedDateTime now = ZonedDateTime.now();
        respFormat = (StringUtils.isNotEmpty(respFormat) ? respFormat.toUpperCase() : "TEXT");

        final String finalQuery = "[CAPITALS ARE INSTRUCTIONS TO LLM, RESPONSE EXPECTED IN " + respFormat + "]\nCURRENT DATE TIME:" + now + "\nQUERY: " + aiPrompt.toUpperCase();

        System.out.println(finalQuery);

        return llmUtils.getOllamaChatModel(model).stream(finalQuery);

    }


}
