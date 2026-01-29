package com.carpool.payment.repository;

import com.carpool.payment.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByToUserId(Long userId);
    
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.toUserId = ?1")
    Double getAverageRating(Long userId);
}