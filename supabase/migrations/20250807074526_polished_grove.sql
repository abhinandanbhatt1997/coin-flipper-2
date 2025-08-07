@@ .. @@
   -- Check if user is already a participant
   SELECT EXISTS(
-    SELECT 1 FROM game_participants 
-    WHERE game_id = selected_game AND user_id = _user_id
+    SELECT 1 FROM game_participants 
+    WHERE game_participants.game_id = selected_game AND game_participants.user_id = _user_id
   ) INTO participant_exists;
 
   -- Only add participant if not already joined
@@ .. @@
     -- Update player count
     UPDATE games
     SET current_players = (
-      SELECT COUNT(*) FROM game_participants WHERE game_id = selected_game
+      SELECT COUNT(*) FROM game_participants WHERE game_participants.game_id = selected_game
     )
     WHERE id = selected_game;