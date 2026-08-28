/* =========================================================
   GIFTED HANDS
   ADMIN.JS

   Handles:
   - Supabase authentication
   - Admin authorization
   - Dashboard
   - Create projects
   - Edit projects
   - Delete projects
   - Image upload
   - Image replacement
   - Logout
   - Mobile sidebar
========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
=========================================================

   REPLACE THESE TWO VALUES WITH YOUR OWN SUPABASE DETAILS.

   IMPORTANT:
   Use your Supabase ANON/PUBLISHABLE key here.
   NEVER put your service_role key in this file.
========================================================= */

const SUPABASE_URL = "https://metcnsyebuisikxmzdxb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6IiRCfiaxHnkMN4geuKPGQ_gTR8gEvT";


/* =========================================================
   INITIALIZE SUPABASE
========================================================= */

let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL !== "https://metcnsyebuisikxmzdxb.supabase.co" &&
    SUPABASE_ANON_KEY !== "sb_publishable_6IiRCfiaxHnkMN4geuKPGQ_gTR8gEvT"
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
}


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let currentProjects = [];
let editingProject = null;

const STORAGE_BUCKET = "project-images";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    initializeMobileMenu();

    initializePasswordToggle();

    initializeDescriptionCounter();

    initializeImagePreview();

    initializeDashboard();

    initializePostForm();

    initializeLogout();

    await initializePage();

});


/* =========================================================
   SUPABASE CHECK
========================================================= */

function checkSupabase() {

    if (!supabaseClient) {

        console.error(
            "Supabase is not configured. Add your Supabase URL and anon/publishable key to admin.js."
        );

        showLoginMessage(
            "Supabase is not configured yet. Add your Supabase URL and anon/publishable key.",
            "error"
        );

        showFormMessage(
            "Supabase is not configured yet. Add your Supabase URL and anon/publishable key.",
            "error"
        );

        return false;
    }

    return true;
}


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializePage() {

    if (!checkSupabase()) {
        return;
    }


    /* -----------------------------------------------------
       Check current authentication
    ----------------------------------------------------- */

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error("Session error:", error);

        redirectToLogin();

        return;
    }


    if (!session) {

        redirectToLogin();

        return;
    }


    currentUser = session.user;


    /* -----------------------------------------------------
       Make sure logged-in user is an admin
    ----------------------------------------------------- */

    const isAdmin = await checkAdminUser(
        currentUser.id
    );


    if (!isAdmin) {

        await supabaseClient.auth.signOut();

        alert(
            "You are not authorized to access the admin panel."
        );

        redirectToLogin();

        return;
    }


    /* -----------------------------------------------------
       Display admin email
    ----------------------------------------------------- */

    setText(
        "admin-email",
        currentUser.email || "Admin"
    );


    /* -----------------------------------------------------
       Page-specific initialization
    ----------------------------------------------------- */

    const page = getCurrentPage();


    if (page === "dashboard") {

        await loadDashboardProjects();

    }


    if (page === "post") {

        await loadPostForEditing();

    }

}


/* =========================================================
   GET CURRENT PAGE
========================================================= */

function getCurrentPage() {

    const path = window.location.pathname.toLowerCase();

    if (path.includes("dashboard.html")) {
        return "dashboard";
    }

    if (path.includes("post.html")) {
        return "post";
    }

    if (path.includes("login.html")) {
        return "login";
    }

    return "";
}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    const path = window.location.pathname.toLowerCase();

    if (!path.includes("login.html")) {

        window.location.href = "login.html";

    }

}


/* =========================================================
   CHECK ADMIN USER
========================================================= */

async function checkAdminUser(userId) {

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
                "Admin check failed:",
                error
            );

            return false;
        }


        return !!data;

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        return false;
    }

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function initializeAuthListener() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (event === "SIGNED_OUT") {

                currentUser = null;

                redirectToLogin();

                return;
            }


            if (session) {

                currentUser = session.user;

                setText(
                    "admin-email",
                    currentUser.email || "Admin"
                );

            }

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    if (!checkSupabase()) {
        return;
    }


    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("login-button");


    const email =
        emailInput?.value.trim();

    const password =
        passwordInput?.value;


    if (!email || !password) {

        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    setButtonLoading(
        loginButton,
        true,
        "LOGGING IN..."
    );


    try {

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


        if (error) {

            console.error(
                "Login error:",
                error
            );

            showLoginMessage(
                getAuthErrorMessage(error),
                "error"
            );

            return;
        }


        if (!data.user) {

            showLoginMessage(
                "Login failed. Please try again.",
                "error"
            );

            return;
        }


        const isAdmin =
            await checkAdminUser(
                data.user.id
            );


        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            showLoginMessage(
                "This account is not authorized to access the admin panel.",
                "error"
            );

            return;
        }


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showLoginMessage(
            "Something went wrong while logging in.",
            "error"
        );

    } finally {

        setButtonLoading(
            loginButton,
            false,
            "LOGIN"
        );

    }

}


/* =========================================================
   LOGIN ERROR MESSAGE
========================================================= */

function getAuthErrorMessage(error) {

    const message =
        String(error?.message || "").toLowerCase();


    if (
        message.includes("invalid login") ||
        message.includes("invalid credentials")
    ) {

        return "Incorrect email or password.";

    }


    if (
        message.includes("email not confirmed")
    ) {

        return "Please confirm your email before logging in.";

    }


    return (
        error?.message ||
        "Unable to log in. Please try again."
    );

}


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

function initializeDashboard() {

    const page =
        getCurrentPage();

    if (page !== "dashboard") {
        return;
    }


    const searchInput =
        document.getElementById("project-search");

    const categoryFilter =
        document.getElementById("category-filter");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterDashboardProjects
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            filterDashboardProjects
        );

    }

}


/* =========================================================
   LOAD DASHBOARD PROJECTS
========================================================= */

async function loadDashboardProjects() {

    if (!supabaseClient) {
        return;
    }


    const container =
        document.getElementById(
            "projects-table-body"
        ) ||
        document.getElementById(
            "dashboard-projects"
        );


    try {

        const {
            data,
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
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Projects loading error:",
                error
            );

            showToast(
                "Unable to load projects.",
                "error"
            );

            return;
        }


        currentProjects =
            data || [];


        updateDashboardStats(
            currentProjects
        );


        renderDashboardProjects(
            currentProjects,
            container
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showToast(
            "Something went wrong while loading projects.",
            "error"
        );

    }

}


/* =========================================================
   UPDATE DASHBOARD STATS
========================================================= */

function updateDashboardStats(projects) {

    const total =
        projects.length;


    const published =
        projects.filter(
            project =>
                project.published === true
        ).length;


    const featured =
        projects.filter(
            project =>
                project.featured === true
        ).length;


    const drafts =
        projects.filter(
            project =>
                project.published !== true
        ).length;


    setPossibleText(
        [
            "total-projects",
            "total-count",
            "projects-count"
        ],
        total
    );


    setPossibleText(
        [
            "published-projects",
            "published-count"
        ],
        published
    );


    setPossibleText(
        [
            "featured-projects",
            "featured-count"
        ],
        featured
    );


    setPossibleText(
        [
            "draft-projects",
            "draft-count"
        ],
        drafts
    );

}


/* =========================================================
   RENDER DASHBOARD PROJECTS
========================================================= */

function renderDashboardProjects(
    projects,
    container
) {

    if (!container) {
        return;
    }


    if (!projects.length) {

        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-projects"
                         style="display:block;">
                        <div class="empty-icon">
                            <i class="fa-solid fa-couch"></i>
                        </div>

                        <h3>No Projects Yet</h3>

                        <p>
                            Create your first portfolio project.
                        </p>

                        <a
                            href="post.html"
                            class="admin-gold-button"
                        >
                            <i class="fa-solid fa-plus"></i>
                            CREATE PROJECT
                        </a>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    container.innerHTML =
        projects.map(
            project =>
                createProjectTableRow(
                    project
                )
        ).join("");

}


/* =========================================================
   CREATE PROJECT TABLE ROW
========================================================= */

function createProjectTableRow(project) {

    const image =
        project.cover_image ||
        "../images/project1.jpg";


    const title =
        escapeHTML(
            project.title ||
            "Untitled Project"
        );


    const category =
        escapeHTML(
            project.category ||
            "Custom Furniture"
        );


    const location =
        escapeHTML(
            project.location ||
            "Nigeria"
        );


    return `
        <tr>

            <td>

                <div class="admin-project">

                    <img
                        class="admin-project-image"
                        src="${escapeAttribute(image)}"
                        alt="${escapeAttribute(title)}"
                        onerror="this.style.opacity='0.25';"
                    >

                    <div class="admin-project-info">

                        <strong>
                            ${title}
                        </strong>

                        <span>
                            ${category}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${location}
            </td>


            <td>

                ${
                    project.published
                    ?
                    `
                    <span class="status-badge status-published">
                        PUBLISHED
                    </span>
                    `
                    :
                    `
                    <span class="status-badge status-draft">
                        DRAFT
                    </span>
                    `
                }

            </td>


            <td>

                ${
                    project.featured
                    ?
                    `
                    <span class="featured-badge">
                        <i class="fa-solid fa-star"></i>
                    </span>
                    `
                    :
                    `
                    <span class="not-featured">
                        —
                    </span>
                    `
                }

            </td>


            <td>
                ${formatDate(project.project_date || project.created_at)}
            </td>


            <td>

                <div class="table-actions">

                    <a
                        href="post.html?id=${encodeURIComponent(project.id)}"
                        class="table-action"
                        title="Edit"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </a>


                    <button
                        type="button"
                        class="table-action delete"
                        title="Delete"
                        onclick="confirmDeleteProject('${escapeAttribute(project.id)}', '${escapeAttribute(title)}')"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* =========================================================
   FILTER DASHBOARD
========================================================= */

function filterDashboardProjects() {

    const searchInput =
        document.getElementById(
            "project-search"
        );


    const categoryFilter =
        document.getElementById(
            "category-filter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const filtered =
        currentProjects.filter(
            project => {

                const matchesSearch =
                    !search ||
                    String(
                        project.title || ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        project.location || ""
                    )
                        .toLowerCase()
                        .includes(search) ||

                    String(
                        project.category || ""
                    )
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all" ||
                    project.category === category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    const container =
        document.getElementById(
            "projects-table-body"
        ) ||
        document.getElementById(
            "dashboard-projects"
        );


    renderDashboardProjects(
        filtered,
        container
    );

}


/* =========================================================
   POST FORM INITIALIZATION
========================================================= */

function initializePostForm() {

    const form =
        document.getElementById(
            "project-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleProjectSubmit
    );

}


/* =========================================================
   LOAD PROJECT FOR EDITING
========================================================= */

async function loadPostForEditing() {

    const form =
        document.getElementById(
            "project-form"
        );


    if (!form) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const projectId =
        params.get("id");


    if (!projectId) {

        setCreateMode();

        return;
    }


    try {

        const {
            data,
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
            .eq("id", projectId)
            .single();


        if (error) {

            console.error(
                "Project loading error:",
                error
            );

            showFormMessage(
                "Unable to load this project.",
                "error"
            );

            return;
        }


        if (!data) {

            showFormMessage(
                "Project not found.",
                "error"
            );

            return;
        }


        editingProject =
            data;


        populateProjectForm(
            data
        );


        setEditMode();


    } catch (error) {

        console.error(
            "Edit loading error:",
            error
        );

        showFormMessage(
            "Something went wrong while loading the project.",
            "error"
        );

    }

}


/* =========================================================
   CREATE MODE
========================================================= */

function setCreateMode() {

    editingProject = null;


    setText(
        "page-title",
        "New Project"
    );


    setText(
        "form-heading",
        "Create a Project."
    );


    setText(
        "form-description",
        "Add a new furniture or interior design project to your public portfolio."
    );


    setText(
        "save-button-text",
        "PUBLISH PROJECT"
    );


    const published =
        document.getElementById(
            "project-published"
        );


    if (published) {
        published.checked = true;
    }

}


/* =========================================================
   EDIT MODE
========================================================= */

function setEditMode() {

    setText(
        "page-title",
        "Edit Project"
    );


    setText(
        "form-heading",
        "Edit a Project."
    );


    setText(
        "form-description",
        "Update the information, image or publishing settings for this project."
    );


    setText(
        "save-button-text",
        "SAVE CHANGES"
    );

}


/* =========================================================
   POPULATE PROJECT FORM
========================================================= */

function populateProjectForm(
    project
) {

    setInputValue(
        "project-id",
        project.id
    );


    setInputValue(
        "project-title",
        project.title
    );


    setInputValue(
        "project-category",
        project.category
    );


    setInputValue(
        "project-location",
        project.location
    );


    setInputValue(
        "project-description",
        project.description
    );


    const published =
        document.getElementById(
            "project-published"
        );


    if (published) {
        published.checked =
            project.published === true;
    }


    const featured =
        document.getElementById(
            "project-featured"
        );


    if (featured) {
        featured.checked =
            project.featured === true;
    }


    /* -----------------------------------------------------
       Existing image
    ----------------------------------------------------- */

    if (project.cover_image) {

        const preview =
            document.getElementById(
                "preview-image"
            );

        const placeholder =
            document.querySelector(
                ".image-placeholder"
            );


        if (preview) {

            preview.src =
                project.cover_image;

            preview.style.display =
                "block";

        }


        if (placeholder) {
            placeholder.style.display =
                "none";
        }


        const selectedFile =
            document.getElementById(
                "selected-file"
            );


        if (selectedFile) {

            selectedFile.textContent =
                "Current project image";

        }

    }


    updateDescriptionCount();

}


/* =========================================================
   HANDLE PROJECT SUBMIT
========================================================= */

async function handleProjectSubmit(
    event
) {

    event.preventDefault();


    if (!supabaseClient) {
        return;
    }


    const form =
        document.getElementById(
            "project-form"
        );


    const saveButton =
        document.getElementById(
            "save-project-button"
        );


    const title =
        getInputValue(
            "project-title"
        );


    const description =
        getInputValue(
            "project-description"
        );


    const location =
        getInputValue(
            "project-location"
        );


    const category =
        getInputValue(
            "project-category"
        );


    const published =
        document.getElementById(
            "project-published"
        )?.checked || false;


    const featured =
        document.getElementById(
            "project-featured"
        )?.checked || false;


    const imageInput =
        document.getElementById(
            "project-image"
        );


    const imageFile =
        imageInput?.files?.[0] || null;


    /* -----------------------------------------------------
       Validation
    ----------------------------------------------------- */

    if (!title) {

        showFormMessage(
            "Project title is required.",
            "error"
        );

        return;
    }


    if (!category) {

        showFormMessage(
            "Please select a project category.",
            "error"
        );

        return;
    }


    if (!description) {

        showFormMessage(
            "Project description is required.",
            "error"
        );

        return;
    }


    if (!location) {

        showFormMessage(
            "Project location is required.",
            "error"
        );

        return;
    }


    if (!editingProject && !imageFile) {

        showFormMessage(
            "Please choose a project image.",
            "error"
        );

        return;
    }


    if (imageFile) {

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(
                imageFile.type
            )
        ) {

            showFormMessage(
                "Only JPG, PNG and WEBP images are allowed.",
                "error"
            );

            return;
        }


        const maxSize =
            5 * 1024 * 1024;


        if (imageFile.size > maxSize) {

            showFormMessage(
                "The image must be smaller than 5MB.",
                "error"
            );

            return;
        }

    }


    setButtonLoading(
        saveButton,
        true,
        editingProject
            ? "SAVING..."
            : "PUBLISHING..."
    );


    showFormMessage(
        "",
        ""
    );


    try {

        /* -------------------------------------------------
           Create slug
        ------------------------------------------------- */

        let slug =
            slugify(title);


        /* -------------------------------------------------
           Make sure slug is unique
        ------------------------------------------------- */

        slug =
            await generateUniqueSlug(
                slug,
                editingProject?.id
            );


        /* -------------------------------------------------
           Upload image if selected
        ------------------------------------------------- */

        let coverImage =
            editingProject?.cover_image ||
            null;


        if (imageFile) {

            coverImage =
                await uploadProjectImage(
                    imageFile,
                    editingProject?.id
                );

        }


        /* -------------------------------------------------
           Project data
        ------------------------------------------------- */

        const projectData = {

            title: title,

            slug: slug,

            description:
                description || null,

            location:
                location || null,

            category:
                category,

            cover_image:
                coverImage,

            featured:
                featured,

            published:
                published,

            project_date:
                editingProject?.project_date ||
                getTodayDate(),

            updated_at:
                new Date().toISOString()

        };


        /* -------------------------------------------------
           UPDATE
        ------------------------------------------------- */

        if (editingProject) {

            const {
                data,
                error
            } = await supabaseClient
                .from("projects")
                .update(projectData)
                .eq(
                    "id",
                    editingProject.id
                )
                .select()
                .single();


            if (error) {

                console.error(
                    "Update error:",
                    error
                );

                throw error;
            }


            editingProject =
                data;


            showFormMessage(
                "Project updated successfully.",
                "success"
            );


            showToast(
                "Project updated successfully.",
                "success"
            );


            setEditMode();


        }


        /* -------------------------------------------------
           CREATE
        ------------------------------------------------- */

        else {

            const {
                data,
                error
            } = await supabaseClient
                .from("projects")
                .insert(
                    projectData
                )
                .select()
                .single();


            if (error) {

                console.error(
                    "Insert error:",
                    error
                );

                throw error;
            }


            showFormMessage(
                "Project created successfully.",
                "success"
            );


            showToast(
                "Project created successfully.",
                "success"
            );


            /* ------------------------------------------------
               Reset form
            ------------------------------------------------ */

            form.reset();

            resetImagePreview();

            setCreateMode();

            updateDescriptionCount();

        }


    } catch (error) {

        console.error(
            "Project save error:",
            error
        );


        showFormMessage(
            getDatabaseErrorMessage(
                error
            ),
            "error"
        );


        showToast(
            "Unable to save project.",
            "error"
        );

    } finally {

        setButtonLoading(
            saveButton,
            false,
            editingProject
                ? "SAVE CHANGES"
                : "PUBLISH PROJECT"
        );

    }

}


/* =========================================================
   GENERATE UNIQUE SLUG
========================================================= */

async function generateUniqueSlug(
    baseSlug,
    currentId = null
) {

    let slug =
        baseSlug ||
        "project";


    let counter = 1;


    while (true) {

        let query =
            supabaseClient
                .from("projects")
                .select("id")
                .eq("slug", slug)
                .limit(1);


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
        } = await query;


        if (error) {

            console.error(
                "Slug check error:",
                error
            );

            throw error;
        }


        if (!data || data.length === 0) {

            return slug;

        }


        slug =
            `${baseSlug}-${counter}`;

        counter++;

    }

}


/* =========================================================
   SLUGIFY
========================================================= */

function slugify(text) {

    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );

}


/* =========================================================
   UPLOAD PROJECT IMAGE
========================================================= */

async function uploadProjectImage(
    file,
    projectId = null
) {

    const extension =
        getFileExtension(
            file.name
        );


    const uniqueName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`;


    const fileName =
        `${uniqueName}.${extension}`;


    const filePath =
        `projects/${fileName}`;


    const {
        error: uploadError
    } = await supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            }
        );


    if (uploadError) {

        console.error(
            "Image upload error:",
            uploadError
        );

        throw new Error(
            "Image upload failed: " +
            uploadError.message
        );

    }


    const {
        data
    } = supabaseClient
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(
            filePath
        );


    if (!data?.publicUrl) {

        throw new Error(
            "Could not create public image URL."
        );

    }


    return data.publicUrl;

}


/* =========================================================
   DELETE PROJECT
========================================================= */

async function deleteProject(
    projectId
) {

    if (!supabaseClient) {
        return;
    }


    if (!projectId) {
        return;
    }


    try {

        /* -------------------------------------------------
           Get project first
        ------------------------------------------------- */

        const {
            data: project,
            error: fetchError
        } = await supabaseClient
            .from("projects")
            .select(
                "id, cover_image"
            )
            .eq(
                "id",
                projectId
            )
            .single();


        if (fetchError) {
            throw fetchError;
        }


        /* -------------------------------------------------
           Delete database record
        ------------------------------------------------- */

        const {
            error: deleteError
        } = await supabaseClient
            .from("projects")
            .delete()
            .eq(
                "id",
                projectId
            );


        if (deleteError) {
            throw deleteError;
        }


        /* -------------------------------------------------
           Try to delete image from Storage
        ------------------------------------------------- */

        if (project?.cover_image) {

            const storagePath =
                getStoragePathFromUrl(
                    project.cover_image
                );


            if (storagePath) {

                const {
                    error: storageError
                } = await supabaseClient
                    .storage
                    .from(STORAGE_BUCKET)
                    .remove([
                        storagePath
                    ]);


                if (storageError) {

                    console.warn(
                        "Project deleted but image cleanup failed:",
                        storageError
                    );

                }

            }

        }


        showToast(
            "Project deleted successfully.",
            "success"
        );


        await loadDashboardProjects();


    } catch (error) {

        console.error(
            "Delete project error:",
            error
        );


        showToast(
            getDatabaseErrorMessage(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   CONFIRM DELETE
========================================================= */

function confirmDeleteProject(
    projectId,
    title
) {

    /* -----------------------------------------------------
       Use custom modal if dashboard has one
    ----------------------------------------------------- */

    const modal =
        document.getElementById(
            "delete-modal"
        );


    if (modal) {

        modal.dataset.projectId =
            projectId;


        const titleElement =
            document.getElementById(
                "delete-project-title"
            );


        if (titleElement) {

            titleElement.textContent =
                title;

        }


        modal.classList.add(
            "active"
        );


        return;

    }


    /* -----------------------------------------------------
       Fallback confirmation
    ----------------------------------------------------- */

    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${title}"?`
        );


    if (confirmed) {

        deleteProject(
            projectId
        );

    }

}


/* =========================================================
   DELETE MODAL SETUP
========================================================= */

function initializeDeleteModal() {

    const modal =
        document.getElementById(
            "delete-modal"
        );


    if (!modal) {
        return;
    }


    const cancel =
        document.getElementById(
            "cancel-delete"
        );


    const confirm =
        document.getElementById(
            "confirm-delete"
        );


    if (cancel) {

        cancel.addEventListener(
            "click",
            () => {

                modal.classList.remove(
                    "active"
                );

            }
        );

    }


    if (confirm) {

        confirm.addEventListener(
            "click",
            async () => {

                const projectId =
                    modal.dataset.projectId;


                modal.classList.remove(
                    "active"
                );


                await deleteProject(
                    projectId
                );

            }
        );

    }


    const overlay =
        modal.querySelector(
            ".admin-modal-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                modal.classList.remove(
                    "active"
                );

            }
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        handleLogout
    );

}


async function handleLogout() {

    if (!supabaseClient) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {
            throw error;
        }


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showToast(
            "Unable to logout. Please try again.",
            "error"
        );

    }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.getElementById(
            "menu-button"
        );


    const closeButton =
        document.getElementById(
            "sidebar-close"
        );


    const sidebar =
        document.getElementById(
            "admin-sidebar"
        );


    const layout =
        document.querySelector(
            ".admin-layout"
        );


    if (!sidebar) {
        return;
    }


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.add(
                    "open"
                );


                if (layout) {

                    layout.classList.add(
                        "sidebar-open"
                    );

                }

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMobileMenu
        );

    }


    if (layout) {

        layout.addEventListener(
            "click",
            event => {

                if (
                    event.target === layout
                ) {

                    closeMobileMenu();

                }

            }
        );

    }


    document
        .querySelectorAll(
            ".admin-nav-link"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMobileMenu
            );

        });

}


function closeMobileMenu() {

    const sidebar =
        document.getElementById(
            "admin-sidebar"
        );


    const layout =
        document.querySelector(
            ".admin-layout"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (layout) {

        layout.classList.remove(
            "sidebar-open"
        );

    }

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function initializePasswordToggle() {

    const toggle =
        document.getElementById(
            "password-toggle"
        );


    const password =
        document.getElementById(
            "password"
        );


    if (!toggle || !password) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            const isPassword =
                password.type === "password";


            password.type =
                isPassword
                    ? "text"
                    : "password";


            const icon =
                toggle.querySelector(
                    "i"
                );


            if (icon) {

                icon.className =
                    isPassword
                        ? "fa-solid fa-eye-slash"
                        : "fa-solid fa-eye";

            }

        }
    );

}


/* =========================================================
   DESCRIPTION COUNTER
========================================================= */

function initializeDescriptionCounter() {

    const description =
        document.getElementById(
            "project-description"
        );


    if (!description) {
        return;
    }


    description.addEventListener(
        "input",
        updateDescriptionCount
    );


    updateDescriptionCount();

}


function updateDescriptionCount() {

    const description =
        document.getElementById(
            "project-description"
        );


    const counter =
        document.getElementById(
            "description-count"
        );


    if (!description || !counter) {
        return;
    }


    counter.textContent =
        description.value.length;

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function initializeImagePreview() {

    const input =
        document.getElementById(
            "project-image"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        handleImageSelection
    );

}


function handleImageSelection(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (
        ![
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(
            file.type
        )
    ) {

        showFormMessage(
            "Only JPG, PNG and WEBP images are allowed.",
            "error"
        );

        event.target.value = "";

        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showFormMessage(
            "The image must be smaller than 5MB.",
            "error"
        );

        event.target.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            const preview =
                document.getElementById(
                    "preview-image"
                );


            const placeholder =
                document.querySelector(
                    ".image-placeholder"
                );


            if (preview) {

                preview.src =
                    e.target.result;

                preview.style.display =
                    "block";

            }


            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

        };


    reader.readAsDataURL(
        file
    );


    const selectedFile =
        document.getElementById(
            "selected-file"
        );


    if (selectedFile) {

        selectedFile.textContent =
            file.name;

    }


    showFormMessage(
        "",
        ""
    );

}


function resetImagePreview() {

    const input =
        document.getElementById(
            "project-image"
        );


    const preview =
        document.getElementById(
            "preview-image"
        );


    const placeholder =
        document.querySelector(
            ".image-placeholder"
        );


    const selectedFile =
        document.getElementById(
            "selected-file"
        );


    if (input) {
        input.value = "";
    }


    if (preview) {

        preview.src = "";

        preview.style.display =
            "none";

    }


    if (placeholder) {

        placeholder.style.display =
            "flex";

    }


    if (selectedFile) {

        selectedFile.textContent =
            "";

    }

}


/* =========================================================
   FORM MESSAGE
========================================================= */

function showFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "project-form-message"
        );


    if (!element) {
        return;
    }


    if (!message) {

        element.textContent = "";

        element.className =
            "form-message";

        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type || ""}`;

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "login-message"
        );


    if (!element) {
        return;
    }


    if (!message) {

        element.textContent = "";

        element.className =
            "login-message";

        return;
    }


    element.textContent =
        message;


    element.className =
        `login-message ${type || ""}`;

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "admin-toast"
        );


    const text =
        document.getElementById(
            "toast-message"
        );


    if (!toast) {
        return;
    }


    if (text) {

        text.textContent =
            message;

    }


    const icon =
        toast.querySelector(
            "i"
        );


    if (icon) {

        icon.className =
            type === "error"
                ? "fa-solid fa-circle-exclamation"
                : "fa-solid fa-circle-check";

    }


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


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    const textElement =
        button.querySelector(
            "#save-button-text"
        );


    if (textElement) {

        textElement.textContent =
            loading
                ? text
                : text;

        return;

    }


    if (loading) {

        button.dataset.originalText =
            button.textContent.trim();


        button.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${text}
            `;

    }

    else {

        const original =
            button.dataset.originalText ||
            text;


        button.innerHTML =
            `
            ${original}
            `;

    }

}


/* =========================================================
   DATABASE ERROR MESSAGES
========================================================= */

function getDatabaseErrorMessage(
    error
) {

    const message =
        String(
            error?.message || ""
        );


    if (
        message
            .toLowerCase()
            .includes(
                "duplicate key"
            )
    ) {

        return "A project with this information already exists.";

    }


    if (
        message
            .toLowerCase()
            .includes(
                "row-level security"
            )
    ) {

        return "You are not authorized to perform this action.";

    }


    return (
        message ||
        "Unable to complete the operation."
    );

}


/* =========================================================
   STORAGE PATH FROM PUBLIC URL
========================================================= */

function getStoragePathFromUrl(
    url
) {

    try {

        const marker =
            `/storage/v1/object/public/${STORAGE_BUCKET}/`;


        const index =
            url.indexOf(
                marker
            );


        if (index === -1) {
            return null;
        }


        return decodeURIComponent(
            url.substring(
                index + marker.length
            )
        );

    } catch (error) {

        console.warn(
            "Could not determine storage path:",
            error
        );

        return null;

    }

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
    filename
) {

    const parts =
        String(filename)
            .split(".");


    return (
        parts.length > 1
            ? parts.pop().toLowerCase()
            : "jpg"
    );

}


/* =========================================================
   TODAY'S DATE
========================================================= */

function getTodayDate() {

    const date =
        new Date();


    return date
        .toISOString()
        .split("T")[0];

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* =========================================================
   SET POSSIBLE TEXT
========================================================= */

function setPossibleText(
    ids,
    value
) {

    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    value;

            }

        }
    );

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


/* =========================================================
   GET INPUT VALUE
========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   INITIALIZE DELETE MODAL
========================================================= */

initializeDeleteModal();


/* =========================================================
   INITIALIZE AUTH LISTENER
========================================================= */

if (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
) {

    initializeAuthListener();

}


/* =========================================================
   LOGIN FORM
========================================================= */

const loginForm =
    document.getElementById(
        "login-form"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

}


/* =========================================================
   MAKE DELETE FUNCTION AVAILABLE
   TO INLINE DASHBOARD BUTTONS
========================================================= */

window.confirmDeleteProject =
    confirmDeleteProject;

window.deleteProject =
    deleteProject;