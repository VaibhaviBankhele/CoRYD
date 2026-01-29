package carpool.matching.controller;

import carpool.matching.dto.MatchRequestDTO;
import carpool.matching.entity.Match;
import carpool.matching.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {
    
    @Autowired
    private MatchingService matchingService;
    
    @PostMapping("/find-match")
    public ResponseEntity<?> findMatch(@RequestBody MatchRequestDTO dto) {
        try {
            Match match = matchingService.findMatch(dto);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{matchId}/accept")
    public ResponseEntity<?> acceptMatch(@PathVariable Long matchId) {
        try {
            Match match = matchingService.acceptMatch(matchId);
            return ResponseEntity.ok(match);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverMatches(@PathVariable Long driverId) {
        try {
            List<Match> matches = matchingService.getDriverMatches(driverId);
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

