import React from "react";
import { useState } from "react";
import { paymentAPI } from "../../api/axiosAPI";

export default function SubmitRating({ rideId, toUserId, type }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async () => {
    await paymentAPI.submitRating({
      rideId,
      fromUserId: JSON.parse(localStorage.getItem("user")).id,
      toUserId,
      type,
      stars,
      comment,
    });
    alert("⭐ Rating submitted");
  };

  return (
    <div>
      <select onChange={(e) => setStars(e.target.value)}>
        {[1, 2, 3, 4, 5].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <input
        placeholder="Comment"
        onChange={(e) => setComment(e.target.value)}
      />
      <button onClick={submit}>Submit Rating</button>
    </div>
  );
}
