package ai.journal.log.entities;


import lombok.NonNull;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Objects;
import java.util.UUID;

@Component
@lombok.Data
public class JournalLog {

    private UUID id;
    private ZonedDateTime createdOn;
    private ZonedDateTime updatedOn;
    private boolean reminderNeeded;
    private ZonedDateTime reminderDate;
    private String message;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JournalLog that = (JournalLog) o;
        return id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }


}
