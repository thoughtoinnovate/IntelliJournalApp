package ai.journal;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;

@SpringBootApplication
@EnableScheduling
public class AiJournalApplication {

    @Value("${ollama.model}")
    private String ollamaModel;

    @Value("${ollama.url}")
    private String ollamaURL;

    @Value("${ollama.temperature}")
    private Float temperature;

    @Bean
    public OllamaApi ollamaApi() {
        return new OllamaApi(ollamaURL);
    }

    @Bean
    public OllamaChatModel ollamaChatModel() {
        return new OllamaChatModel(ollamaApi(), OllamaOptions.create().withModel(ollamaModel).withTemperature(temperature));
    }

    @Bean
    public RestTemplate ollamaRESTClient() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory(ollamaURL));
        return restTemplate;
    }

    @Bean
    public ObjectMapper journalObjectMapper() {
        final SimpleModule module = new JavaTimeModule();
        return new ObjectMapper().registerModule(module).disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public static void main(String[] args) {
        SpringApplication.run(AiJournalApplication.class, args);
    }

}
