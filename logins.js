// ============================================================
// GIFTED HANDS - LOGIN.JS
// Supabase Admin Login
// ============================================================


// ============================================================
// 1. SUPABASE CONFIG
// ============================================================

// PUT YOUR REAL SUPABASE DETAILS HERE

const SUPABASE_URL = "https://metcnsyebuisikxmzdxb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6IiRCfiaxHnkMN4geuKPGQ_gTR8gEvT";


// ============================================================
// 2. CREATE SUPABASE CLIENT
// ============================================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// 3. GET LOGIN ELEMENTS
// ============================================================

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("login-button");
const loginButtonText = document.getElementById("login-button-text");

const loginError = document.getElementById("login-error");

const togglePassword = document.getElementById("toggle-password");


// ============================================================
// 4. SHOW ERROR
// ============================================================

function showError(message) {

    loginError.textContent = message;
    loginError.style.display = "block";

}


// ============================================================
// 5. CLEAR ERROR
// ============================================================

function clearError() {

    loginError.textContent = "";
    loginError.style.display = "none";

}


// ============================================================
// 6. PASSWORD SHOW / HIDE
// ============================================================

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.innerHTML =
            '<i class="fa-regular fa-eye-slash"></i>';

        togglePassword.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        passwordInput.type = "password";

        togglePassword.innerHTML =
            '<i class="fa-regular fa-eye"></i>';

        togglePassword.setAttribute(
            "aria-label",
            "Show password"
        );

    }

});


// ============================================================
// 7. CHECK IF ALREADY LOGGED IN
// ============================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }


        if (!data.session) {
            return;
        }


        // User already has a session.
        // Check whether they are actually an admin.

        const user =
            data.session.user;


        const isAdmin =
            await checkAdmin(user.id);


        if (isAdmin) {

            window.location.href =
                "dashboard.html";

        } else {

            // Not an admin.
            await supabaseClient.auth.signOut();

        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

    }

}


// ============================================================
// 8. CHECK ADMIN_USERS TABLE
// ============================================================

async function checkAdmin(userId) {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("admin_users")
            .select("id")
            .eq("id", userId)
            .maybeSingle();


        if (error) {

            console.error(
                "Admin check error:",
                error
            );

            return false;
        }


        return data !== null;

    } catch (error) {

        console.error(
            "Admin check failed:",
            error
        );

        return false;
    }

}


// ============================================================
// 9. LOGIN FORM
// ============================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearError();


        // ----------------------------------------------------
        // Get values
        // ----------------------------------------------------

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ----------------------------------------------------
        // Basic validation
        // ----------------------------------------------------

        if (!email) {

            showError(
                "Please enter your email address."
            );

            emailInput.focus();

            return;
        }


        if (!password) {

            showError(
                "Please enter your password."
            );

            passwordInput.focus();

            return;
        }


        // ----------------------------------------------------
        // Loading state
        // ----------------------------------------------------

        loginButton.disabled = true;

        loginButtonText.textContent =
            "SIGNING IN...";


        try {

            // ------------------------------------------------
            // Supabase authentication
            // ------------------------------------------------

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            // ------------------------------------------------
            // Authentication failed
            // ------------------------------------------------

            if (error) {

                console.error(
                    "Supabase login error:",
                    error
                );


                showError(
                    getLoginError(error)
                );


                return;
            }


            // ------------------------------------------------
            // Make sure a user was returned
            // ------------------------------------------------

            if (!data.user) {

                showError(
                    "Login failed. Please try again."
                );

                return;
            }


            // ------------------------------------------------
            // Check admin_users
            // ------------------------------------------------

            const isAdmin =
                await checkAdmin(
                    data.user.id
                );


            if (!isAdmin) {

                // User successfully logged into Supabase
                // but isn't in admin_users.

                await supabaseClient.auth.signOut();


                showError(
                    "This account does not have administrator access."
                );


                return;
            }


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            loginButtonText.textContent =
                "SUCCESS";


            // Give Supabase a moment to finish storing
            // the authenticated session.

            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                300
            );


        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );


            showError(
                "Something went wrong. Please try again."
            );


        } finally {

            // Don't immediately enable the button after
            // successful login because we're redirecting.

            if (
                loginButtonText.textContent !==
                "SUCCESS"
            ) {

                loginButton.disabled =
                    false;

                loginButtonText.textContent =
                    "SIGN IN";

            }

        }

    }
);


// ============================================================
// 10. FRIENDLY LOGIN ERRORS
// ============================================================

function getLoginError(error) {

    const message =
        String(
            error.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email address before signing in.";

    }


    if (
        message.includes(
            "too many requests"
        )
    ) {

        return "Too many login attempts. Please wait a moment and try again.";

    }


    if (
        message.includes(
            "network"
        )
    ) {

        return "Network error. Check your internet connection.";

    }


    return (
        error.message ||
        "Unable to sign in. Please try again."
    );

}


// ============================================================
// 11. RUN SESSION CHECK
// ============================================================

checkExistingSession();
