package ai.journal.log.entities;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Journal {

    @NonNull
    private UUID id;
    private String name;
    private ZonedDateTime createdDate;
    private ZonedDateTime updatedDate;
    private Set<JournalLog> journalLogs;

    public void addJournalLog(JournalLog journalLog) {

        do {
            UUID id = UUID.randomUUID();
            journalLog.setId(id);
        } while (journalLogs.contains(journalLog));
        journalLogs.add(journalLog);
    }

}
