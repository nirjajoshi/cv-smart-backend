import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {loginUser} from "../controllers/login_user.controller.js";
import { logoutUser } from "../controllers/logout_user.controller.js"; 
import {updateUserStatus} from"../controllers/update_status.controller.js";
import {saveUserUpdates} from "../controllers/save_status.controller.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.route("/logout").post(logoutUser); 
router.route("/update-status").post(updateUserStatus); 
router.route("/save-status").post(saveUserUpdates);

export default router;