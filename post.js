// ============================================================
// GIFTED HANDS FURNITURE & INTERIOR DESIGNS
// post.js
// ============================================================


// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ============================================================
// ELEMENTS
// ============================================================

const form = document.getElementById("project-form");

const projectIdInput =
    document.getElementById("project-id");

const titleInput =
    document.getElementById("project-title");

const categoryInput =
    document.getElementById("project-category");

const locationInput =
    document.getElementById("project-location");

const descriptionInput =
    document.getElementById("project-description");

const imageInput =
    document.getElementById("project-image");

const previewImage =
    document.getElementById("preview-image");

const imagePreview =
    document.getElementById("image-preview");

const selectedFile =
    document.getElementById("selected-file");

const descriptionCount =
    document.getElementById("description-count");

const publishedInput =
    document.getElementById("project-published");

const featuredInput =
    document.getElementById("project-featured");

const formMessage =
    document.getElementById("project-form-message");

const saveButton =
    document.getElementById("save-project-button");

const saveButtonText =
    document.getElementById("save-button-text");

const pageTitle =
    document.getElementById("page-title");

const formHeading =
    document.getElementById("form-heading");

const formDescription =
    document.getElementById("form-description");

const adminEmail =
    document.getElementById("admin-email");

const sidebar =
    document.getElementById("admin-sidebar");

const menuButton =
    document.getElementById("menu-button");

const sidebarClose =
    document.getElementById("sidebar-close");

const logoutButton =
    document.getElementById("logout-button");

const toast =
    document.getElementById("admin-toast");

const toastMessage =
    document.getElementById("toast-message");


// ============================================================
// EDIT MODE
// ============================================================

const urlParams =
    new URLSearchParams(window.location.search);

const editingProjectId =
    urlParams.get("id");

let existingProject = null;


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializePostPage
);


async function initializePostPage() {

    try {

        // ------------------------------------------------------
        // Make sure Supabase loaded
        // ------------------------------------------------------

        if (!window.supabase) {

            showMessage(
                "Supabase could not be loaded. Check your internet connection.",
                "error"
            );

            return;
        }


        // ------------------------------------------------------
        // Check login
        // ------------------------------------------------------

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(error);

            redirectToLogin();

            return;
        }


        const session =
            data.session;


        if (!session || !session.user) {

            redirectToLogin();

            return;
        }


        // ------------------------------------------------------
        // Verify admin
        // ------------------------------------------------------

        const {
            data: adminUser,
            error: adminError
        } = await supabaseClient
            .from("admin_users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();


        if (adminError) {

            console.error(
                "Admin verification error:",
                adminError
            );

            showMessage(
                "Unable to verify administrator access.",
                "error"
            );

            return;
        }


        if (!adminUser) {

            await supabaseClient.auth.signOut();

            redirectToLogin();

            return;
        }


        // ------------------------------------------------------
        // Display admin email
        // ------------------------------------------------------

        if (adminEmail) {

            adminEmail.textContent =
                session.user.email || "Admin";

        }


        // ------------------------------------------------------
        // Edit or create mode
        // ------------------------------------------------------

        if (editingProjectId) {

            await loadProjectForEditing(
                editingProjectId
            );

        } else {

            setupCreateMode();

        }


    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showMessage(
            "Something went wrong loading the page.",
            "error"
        );

    }

}


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToLogin() {

    window.location.href =
        "login.html";

}


// ============================================================
// CREATE MODE
// ============================================================

function setupCreateMode() {

    if (pageTitle) {

        pageTitle.textContent =
            "New Project";

    }


    if (formHeading) {

        formHeading.innerHTML =
            'Create a <span>Project.</span>';

    }


    if (formDescription) {

        formDescription.textContent =
            "Add a new furniture or interior design project to your public portfolio.";

    }


    if (saveButtonText) {

        saveButtonText.textContent =
            "PUBLISH PROJECT";

    }

}


// ============================================================
// LOAD PROJECT FOR EDITING
// ============================================================

async function loadProjectForEditing(projectId) {

    try {

        setButtonLoading(
            true,
            "LOADING..."
        );


        const {
            data: project,
            error
        } = await supabaseClient
            .from("projects")
            .select(`
                id,
                title,
                slug,
                description,
                location,
                category,
                cover_image,
                featured,
                published,
                project_date,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                projectId
            )
            .single();


        if (error) {

            console.error(
                "Project loading error:",
                error
            );

            showMessage(
                "Could not load this project.",
                "error"
            );

            setButtonLoading(
                false
            );

            return;
        }


        if (!project) {

            showMessage(
                "Project not found.",
                "error"
            );

            setButtonLoading(
                false
            );

            return;
        }


        existingProject =
            project;


        // ------------------------------------------------------
        // Fill form
        // ------------------------------------------------------

        projectIdInput.value =
            project.id;


        titleInput.value =
            project.title || "";


        categoryInput.value =
            project.category || "";


        locationInput.value =
            project.location || "";


        descriptionInput.value =
            project.description || "";


        publishedInput.checked =
            project.published === true;


        featuredInput.checked =
            project.featured === true;


        updateCharacterCount();


        // ------------------------------------------------------
        // Existing image
        // ------------------------------------------------------

        if (project.cover_image) {

            showExistingImage(
                project.cover_image
            );

        }


        // ------------------------------------------------------
        // Change page text
        // ------------------------------------------------------

        if (pageTitle) {

            pageTitle.textContent =
                "Edit Project";

        }


        if (formHeading) {

            formHeading.innerHTML =
                'Edit your <span>Project.</span>';

        }


        if (formDescription) {

            formDescription.textContent =
                "Update the information and image for this portfolio project.";

        }


        if (saveButtonText) {

            saveButtonText.textContent =
                "SAVE CHANGES";

        }


        setButtonLoading(
            false
        );


    } catch (error) {

        console.error(
            "Edit loading error:",
            error
        );

        showMessage(
            "Something went wrong loading the project.",
            "error"
        );

        setButtonLoading(
            false
        );

    }

}


// ============================================================
// DESCRIPTION CHARACTER COUNT
// ============================================================

descriptionInput.addEventListener(
    "input",
    updateCharacterCount
);


function updateCharacterCount() {

    const length =
        descriptionInput.value.length;


    descriptionCount.textContent =
        length;

}


// ============================================================
// IMAGE SELECTION
// ============================================================

imageInput.addEventListener(
    "change",
    handleImageSelection
);


function handleImageSelection() {

    const file =
        imageInput.files[0];


    if (!file) {

        selectedFile.textContent =
            "";

        return;
    }


    // --------------------------------------------------------
    // Maximum 5MB
    // --------------------------------------------------------

    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        imageInput.value =
            "";

        selectedFile.textContent =
            "";

        hidePreview();


        showMessage(
            "Image is too large. Maximum size is 5MB.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // File type
    // --------------------------------------------------------

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        imageInput.value =
            "";

        selectedFile.textContent =
            "";

        hidePreview();


        showMessage(
            "Please select a JPG, JPEG, PNG or WEBP image.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // File information
    // --------------------------------------------------------

    const sizeMB =
        (
            file.size /
            (1024 * 1024)
        ).toFixed(2);


    selectedFile.textContent =
        `${file.name} — ${sizeMB} MB`;


    // --------------------------------------------------------
    // Preview
    // --------------------------------------------------------

    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            previewImage.src =
                event.target.result;

            previewImage.style.display =
                "block";

            const placeholder =
                imagePreview.querySelector(
                    ".image-placeholder"
                );

            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        };


    reader.readAsDataURL(file);


    clearMessage();

}


// ============================================================
// SHOW EXISTING IMAGE
// ============================================================

function showExistingImage(url) {

    previewImage.src =
        url;


    previewImage.style.display =
        "block";


    const placeholder =
        imagePreview.querySelector(
            ".image-placeholder"
        );


    if (placeholder) {

        placeholder.style.display =
            "none";

    }


    selectedFile.textContent =
        "Current project image";

}


// ============================================================
// HIDE IMAGE PREVIEW
// ============================================================

function hidePreview() {

    previewImage.src =
        "";


    previewImage.style.display =
        "none";


    const placeholder =
        imagePreview.querySelector(
            ".image-placeholder"
        );


    if (placeholder) {

        placeholder.style.display =
            "flex";

    }

}


// ============================================================
// FORM SUBMISSION
// ============================================================

form.addEventListener(
    "submit",
    handleFormSubmit
);


async function handleFormSubmit(event) {

    event.preventDefault();


    clearMessage();


    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------

    const title =
        titleInput.value.trim();


    const category =
        categoryInput.value;


    const location =
        locationInput.value.trim();


    const description =
        descriptionInput.value.trim();


    if (!title) {

        showMessage(
            "Please enter a project title.",
            "error"
        );

        titleInput.focus();

        return;
    }


    if (!category) {

        showMessage(
            "Please select a project category.",
            "error"
        );

        categoryInput.focus();

        return;
    }


    if (!location) {

        showMessage(
            "Please enter the project location.",
            "error"
        );

        locationInput.focus();

        return;
    }


    if (!description) {

        showMessage(
            "Please enter a project description.",
            "error"
        );

        descriptionInput.focus();

        return;
    }


    // --------------------------------------------------------
    // Require image for new project
    // --------------------------------------------------------

    if (
        !editingProjectId &&
        !imageInput.files[0]
    ) {

        showMessage(
            "Please choose a project image.",
            "error"
        );

        return;
    }


    try {

        setButtonLoading(
            true,
            editingProjectId
                ? "SAVING..."
                : "PUBLISHING..."
        );


        // ----------------------------------------------------
        // Make sure session still exists
        // ----------------------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            redirectToLogin();

            return;
        }


        // ----------------------------------------------------
        // Generate slug
        // ----------------------------------------------------

        const slug =
            await createUniqueSlug(
                title,
                editingProjectId
            );


        // ----------------------------------------------------
        // Image URL
        // ----------------------------------------------------

        let coverImage =
            existingProject
                ? existingProject.cover_image
                : null;


        // ----------------------------------------------------
        // Upload new image if selected
        // ----------------------------------------------------

        if (imageInput.files[0]) {

            coverImage =
                await uploadProjectImage(
                    imageInput.files[0]
                );

        }


        // ----------------------------------------------------
        // Prepare database data
        // ----------------------------------------------------

        const projectData = {

            title: title,

            slug: slug,

            description: description,

            location: location,

            category: category,

            cover_image: coverImage,

            featured:
                featuredInput.checked,

            published:
                publishedInput.checked

        };


        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------

        if (editingProjectId) {

            const {
                error
            } = await supabaseClient
                .from("projects")
                .update(
                    projectData
                )
                .eq(
                    "id",
                    editingProjectId
                );


            if (error) {

                console.error(
                    "Update error:",
                    error
                );

                showMessage(
                    getDatabaseErrorMessage(
                        error
                    ),
                    "error"
                );

                return;
            }


            showToast(
                "Project updated successfully."
            );


            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                1000
            );


        } else {

            // ------------------------------------------------
            // INSERT
            // ------------------------------------------------

            const {
                error
            } = await supabaseClient
                .from("projects")
                .insert(
                    projectData
                );


            if (error) {

                console.error(
                    "Insert error:",
                    error
                );

                showMessage(
                    getDatabaseErrorMessage(
                        error
                    ),
                    "error"
                );

                return;
            }


            showToast(
                "Project created successfully."
            );


            // ------------------------------------------------
            // Reset form
            // ------------------------------------------------

            form.reset();

            updateCharacterCount();

            hidePreview();

            selectedFile.textContent =
                "";


            publishedInput.checked =
                true;


            featuredInput.checked =
                false;


            // ------------------------------------------------
            // Go dashboard
            // ------------------------------------------------

            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                1000
            );

        }


    } catch (error) {

        console.error(
            "Project save error:",
            error
        );

        showMessage(
            error.message ||
            "Something went wrong while saving the project.",
            "error"
        );

    } finally {

        setButtonLoading(
            false
        );

    }

}


// ============================================================
// UPLOAD IMAGE
// ============================================================

async function uploadProjectImage(file) {

    // --------------------------------------------------------
    // Create unique filename
    // --------------------------------------------------------

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const randomId =
        crypto.randomUUID();


    const filePath =
        `${randomId}.${extension}`;


    // --------------------------------------------------------
    // Upload
    // --------------------------------------------------------

    const {
        error
    } = await supabaseClient
        .storage
        .from("project-images")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false
            }
        );


    if (error) {

        console.error(
            "Storage upload error:",
            error
        );

        throw new Error(
            "Image upload failed: " +
            error.message
        );

    }


    // --------------------------------------------------------
    // Get public URL
    // --------------------------------------------------------

    const {
        data
    } = supabaseClient
        .storage
        .from("project-images")
        .getPublicUrl(
            filePath
        );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "The image uploaded, but its public URL could not be created."
        );

    }


    return data.publicUrl;

}


// ============================================================
// CREATE UNIQUE SLUG
// ============================================================

async function createUniqueSlug(
    title,
    currentId = null
) {

    let baseSlug =
        slugify(title);


    if (!baseSlug) {

        baseSlug =
            "project";

    }


    let slug =
        baseSlug;


    let counter =
        1;


    while (true) {

        let query =
            supabaseClient
                .from("projects")
                .select("id")
                .eq(
                    "slug",
                    slug
                );


        // Don't count the project itself while editing.

        if (currentId) {

            query =
                query.neq(
                    "id",
                    currentId
                );

        }


        const {
            data,
            error
        } = await query
            .maybeSingle();


        if (error) {

            // A "no rows" response should not be treated
            // as a fatal error.

            if (
                error.code !==
                "PGRST116"
            ) {

                console.error(
                    "Slug check error:",
                    error
                );

                throw new Error(
                    "Could not check project slug."
                );

            }

        }


        if (!data) {

            return slug;

        }


        counter++;

        slug =
            `${baseSlug}-${counter}`;

    }

}


// ============================================================
// SLUGIFY
// ============================================================

function slugify(text) {

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(
            /[^\w\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        );

}


// ============================================================
// DATABASE ERROR MESSAGE
// ============================================================

function getDatabaseErrorMessage(error) {

    if (!error) {

        return "Unable to save the project.";

    }


    // Duplicate slug

    if (
        error.code === "23505"
    ) {

        return "A project with this slug already exists. Try a different title.";

    }


    // RLS / permission error

    if (
        error.code === "42501"
    ) {

        return "You do not have permission to modify projects.";

    }


    return (
        error.message ||
        "Unable to save the project."
    );

}


// ============================================================
// BUTTON LOADING
// ============================================================

function setButtonLoading(
    loading,
    text = "PLEASE WAIT..."
) {

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        loading;


    if (loading) {

        saveButtonText.textContent =
            text;

    } else {

        saveButtonText.textContent =
            editingProjectId
                ? "SAVE CHANGES"
                : "PUBLISH PROJECT";

    }

}


// ============================================================
// FORM MESSAGE
// ============================================================

function showMessage(
    message,
    type = "error"
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        message;


    formMessage.className =
        "form-message " +
        type;


    formMessage.style.display =
        "block";

}


function clearMessage() {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        "";


    formMessage.className =
        "form-message";


    formMessage.style.display =
        "none";

}


// ============================================================
// TOAST
// ============================================================

let toastTimer;


function showToast(message) {

    if (!toast) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.add(
                "open"
            );

        }
    );

}


if (sidebarClose) {

    sidebarClose.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "open"
            );

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled =
                true;


            const {
                error
            } = await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                logoutButton.disabled =
                    false;

                showToast(
                    "Could not log out."
                );

                return;
            }


            window.location.href =
                "login.html";

        }
    );

}


// ============================================================
// PREVENT ACCIDENTAL PAGE LEAVE WHILE UPLOADING
// ============================================================

let isSaving =
    false;


form.addEventListener(
    "submit",
    () => {

        isSaving =
            true;

    }
);


window.addEventListener(
    "beforeunload",
    event => {

        if (isSaving) {

            event.preventDefault();

            event.returnValue =
                "";

        }

    }
);
