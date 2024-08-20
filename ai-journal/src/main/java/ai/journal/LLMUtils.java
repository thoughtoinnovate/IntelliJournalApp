package ai.journal;

import org.apache.commons.lang3.StringUtils;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class LLMUtils {

    @Value("${ollama.temperature}")
    private Float temperature;

    private final OllamaChatModel chatModel;
    private final OllamaApi ollamaApi;

    public LLMUtils(OllamaChatModel chatModel, OllamaApi ollamaApi) {
        this.chatModel = chatModel;
        this.ollamaApi = ollamaApi;
    }



    /**
     * Returns an instance of OllamaChatModel based on the given model name.
     *
     * @param  model  the name of the model to be used
     * @return        an instance of OllamaChatModel based on the given model name
     */
    public OllamaChatModel getOllamaChatModel(String model) {
        if (StringUtils.isNotEmpty(model)) {
            OllamaOptions defaultOptions = OllamaOptions.create().withModel(model).withTemperature(temperature);
            return new OllamaChatModel(ollamaApi, defaultOptions);
        } else {
            return this.chatModel;
        }
    }

}
