// ============================================================
// GIFTED HANDS
// dashboard.js
// ============================================================

// ------------------------------------------------------------
// SUPABASE CONFIG
// ------------------------------------------------------------

const SUPABASE_URL = "https://metcnsyebuisikxmzdxb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6IiRCfiaxHnkMN4geuKPGQ_gTR8gEvT";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ------------------------------------------------------------
// GLOBAL VARIABLES
// ------------------------------------------------------------

let allProjects = [];
let selectedProjectId = null;


// ------------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------------

const sidebar = document.getElementById("admin-sidebar");
const sidebarClose = document.getElementById("sidebar-close");
const menuButton = document.getElementById("menu-button");

const logoutButton = document.getElementById("logout-button");

const adminEmail = document.getElementById("admin-email");

const totalProjects = document.getElementById("total-projects");
const publishedProjects = document.getElementById("published-projects");
const featuredProjects = document.getElementById("featured-projects");
const projectCategories = document.getElementById("project-categories");

const projectsList = document.getElementById("admin-projects-list");
const loadingRow = document.getElementById("projects-loading-row");

const emptyProjects = document.getElementById("empty-projects");
const noSearchResults = document.getElementById("no-search-results");

const searchInput = document.getElementById("project-search");
const categoryFilter = document.getElementById("category-filter");

const deleteModal = document.getElementById("delete-modal");
const deleteModalClose = document.getElementById("delete-modal-close");
const cancelDelete = document.getElementById("cancel-delete");
const confirmDelete = document.getElementById("confirm-delete");
const deleteProjectName = document.getElementById("delete-project-name");

const toast = document.getElementById("admin-toast");
const toastMessage = document.getElementById("toast-message");


// ------------------------------------------------------------
// INITIALIZE DASHBOARD
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    await checkAdminSession();

});


// ------------------------------------------------------------
// CHECK SESSION + ADMIN
// ------------------------------------------------------------

async function checkAdminSession() {

    try {

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {
            console.error(sessionError);
            redirectToLogin();
            return;
        }


        const session = sessionData.session;


        if (!session || !session.user) {

            redirectToLogin();
            return;

        }


        const user = session.user;


        // ----------------------------------------------------
        // Verify user exists in admin_users
        // ----------------------------------------------------

        const {
            data: adminUser,
            error: adminError
        } = await supabaseClient
            .from("admin_users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();


        if (adminError) {

            console.error(
                "Admin verification error:",
                adminError
            );

            showToast(
                "Unable to verify administrator access.",
                true
            );

            await supabaseClient.auth.signOut();

            redirectToLogin();

            return;

        }


        if (!adminUser) {

            await supabaseClient.auth.signOut();

            redirectToLogin();

            return;

        }


        // ----------------------------------------------------
        // Display email
        // ----------------------------------------------------

        if (adminEmail) {

            adminEmail.textContent =
                user.email || "Admin";

        }


        // ----------------------------------------------------
        // Load projects
        // ----------------------------------------------------

        await loadProjects();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

        redirectToLogin();

    }

}


// ------------------------------------------------------------
// REDIRECT TO LOGIN
// ------------------------------------------------------------

function redirectToLogin() {

    window.location.href = "login.html";

}


// ------------------------------------------------------------
// LOAD PROJECTS
// ------------------------------------------------------------

async function loadProjects() {

    try {

        showLoading();


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
                "Could not load projects.",
                true
            );

            showEmptyState();

            return;

        }


        allProjects = data || [];


        updateStatistics();

        renderProjects(allProjects);

    } catch (error) {

        console.error(
            "Unexpected projects error:",
            error
        );

        showToast(
            "Something went wrong while loading projects.",
            true
        );

        showEmptyState();

    }

}


// ------------------------------------------------------------
// SHOW LOADING
// ------------------------------------------------------------

function showLoading() {

    if (loadingRow) {

        loadingRow.style.display =
            "table-row";

    }

    if (emptyProjects) {

        emptyProjects.style.display =
            "none";

    }

    if (noSearchResults) {

        noSearchResults.style.display =
            "none";

    }

}


// ------------------------------------------------------------
// UPDATE STATISTICS
// ------------------------------------------------------------

function updateStatistics() {

    const total =
        allProjects.length;


    const published =
        allProjects.filter(
            project => project.published === true
        ).length;


    const featured =
        allProjects.filter(
            project => project.featured === true
        ).length;


    const categories =
        new Set(
            allProjects
                .map(project => project.category)
                .filter(Boolean)
        ).size;


    totalProjects.textContent =
        total;


    publishedProjects.textContent =
        published;


    featuredProjects.textContent =
        featured;


    projectCategories.textContent =
        categories;

}


// ------------------------------------------------------------
// RENDER PROJECTS
// ------------------------------------------------------------

function renderProjects(projects) {

    if (loadingRow) {

        loadingRow.style.display =
            "none";

    }


    // Remove old project rows but preserve nothing else.

    projectsList.innerHTML = "";


    // --------------------------------------------------------
    // No projects at all
    // --------------------------------------------------------

    if (allProjects.length === 0) {

        emptyProjects.style.display =
            "block";

        noSearchResults.style.display =
            "none";

        return;

    }


    emptyProjects.style.display =
        "none";


    // --------------------------------------------------------
    // Search/filter produced nothing
    // --------------------------------------------------------

    if (projects.length === 0) {

        noSearchResults.style.display =
            "block";

        return;

    }


    noSearchResults.style.display =
        "none";


    // --------------------------------------------------------
    // Create rows
    // --------------------------------------------------------

    projects.forEach(project => {

        const row =
            document.createElement("tr");


        // ----------------------------------------------------
        // Project
        // ----------------------------------------------------

        const projectCell =
            document.createElement("td");


        projectCell.className =
            "project-table-info";


        const image =
            document.createElement("img");


        image.className =
            "project-table-image";


        image.src =
            project.cover_image ||
            "../images/hero.jpg";


        image.alt =
            project.title || "Project";


        image.onerror =
            function () {

                this.src =
                    "../images/hero.jpg";

            };


        const title =
            document.createElement("strong");


        title.textContent =
            project.title || "Untitled Project";


        projectCell.appendChild(image);
        projectCell.appendChild(title);


        // ----------------------------------------------------
        // Category
        // ----------------------------------------------------

        const categoryCell =
            document.createElement("td");


        categoryCell.textContent =
            project.category || "Custom Furniture";


        // ----------------------------------------------------
        // Location
        // ----------------------------------------------------

        const locationCell =
            document.createElement("td");


        locationCell.textContent =
            project.location || "—";


        // ----------------------------------------------------
        // Published status
        // ----------------------------------------------------

        const statusCell =
            document.createElement("td");


        const status =
            document.createElement("span");


        status.className =
            project.published
                ? "status-badge published"
                : "status-badge draft";


        status.textContent =
            project.published
                ? "Published"
                : "Draft";


        statusCell.appendChild(status);


        // ----------------------------------------------------
        // Featured
        // ----------------------------------------------------

        const featuredCell =
            document.createElement("td");


        const featured =
            document.createElement("span");


        featured.className =
            project.featured
                ? "featured-badge active"
                : "featured-badge";


        featured.innerHTML =
            project.featured
                ? '<i class="fa-solid fa-star"></i> Yes'
                : '<i class="fa-regular fa-star"></i> No';


        featuredCell.appendChild(featured);


        // ----------------------------------------------------
        // Actions
        // ----------------------------------------------------

        const actionsCell =
            document.createElement("td");


        actionsCell.className =
            "project-actions";


        // EDIT

        const editButton =
            document.createElement("button");


        editButton.type =
            "button";


        editButton.className =
            "table-action edit";


        editButton.title =
            "Edit project";


        editButton.innerHTML =
            '<i class="fa-solid fa-pen"></i>';


        editButton.addEventListener(
            "click",
            () => editProject(project.id)
        );


        // DELETE

        const deleteButton =
            document.createElement("button");


        deleteButton.type =
            "button";


        deleteButton.className =
            "table-action delete";


        deleteButton.title =
            "Delete project";


        deleteButton.innerHTML =
            '<i class="fa-solid fa-trash"></i>';


        deleteButton.addEventListener(
            "click",
            () => openDeleteModal(project)
        );


        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);


        // ----------------------------------------------------
        // Add cells
        // ----------------------------------------------------

        row.appendChild(projectCell);
        row.appendChild(categoryCell);
        row.appendChild(locationCell);
        row.appendChild(statusCell);
        row.appendChild(featuredCell);
        row.appendChild(actionsCell);


        projectsList.appendChild(row);

    });

}


// ------------------------------------------------------------
// SEARCH
// ------------------------------------------------------------

searchInput.addEventListener(
    "input",
    filterProjects
);


// ------------------------------------------------------------
// CATEGORY FILTER
// ------------------------------------------------------------

categoryFilter.addEventListener(
    "change",
    filterProjects
);


// ------------------------------------------------------------
// FILTER PROJECTS
// ------------------------------------------------------------

function filterProjects() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const category =
        categoryFilter.value;


    const filtered =
        allProjects.filter(project => {

            const title =
                (project.title || "")
                    .toLowerCase();


            const location =
                (project.location || "")
                    .toLowerCase();


            const projectCategory =
                project.category || "";


            const matchesSearch =
                !search ||
                title.includes(search) ||
                location.includes(search);


            const matchesCategory =
                category === "all" ||
                projectCategory === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    renderProjects(filtered);

}


// ------------------------------------------------------------
// EDIT PROJECT
// ------------------------------------------------------------

function editProject(projectId) {

    window.location.href =
        `post.html?id=${encodeURIComponent(projectId)}`;

}


// ------------------------------------------------------------
// OPEN DELETE MODAL
// ------------------------------------------------------------

function openDeleteModal(project) {

    selectedProjectId =
        project.id;


    deleteProjectName.textContent =
        project.title || "this project";


    deleteModal.setAttribute(
        "aria-hidden",
        "false"
    );


    deleteModal.classList.add(
        "active"
    );

}


// ------------------------------------------------------------
// CLOSE DELETE MODAL
// ------------------------------------------------------------

function closeDeleteModal() {

    selectedProjectId =
        null;


    deleteModal.setAttribute(
        "aria-hidden",
        "true"
    );


    deleteModal.classList.remove(
        "active"
    );

}


deleteModalClose.addEventListener(
    "click",
    closeDeleteModal
);


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


// Close when clicking overlay

const deleteOverlay =
    deleteModal.querySelector(
        ".admin-modal-overlay"
    );


if (deleteOverlay) {

    deleteOverlay.addEventListener(
        "click",
        closeDeleteModal
    );

}


// ------------------------------------------------------------
// CONFIRM DELETE
// ------------------------------------------------------------

confirmDelete.addEventListener(
    "click",
    async function () {

        if (!selectedProjectId) {
            return;
        }


        confirmDelete.disabled =
            true;


        confirmDelete.textContent =
            "DELETING...";


        try {

            const project =
                allProjects.find(
                    item =>
                        item.id === selectedProjectId
                );


            // ------------------------------------------------
            // Delete database record
            // ------------------------------------------------

            const {
                error
            } = await supabaseClient
                .from("projects")
                .delete()
                .eq(
                    "id",
                    selectedProjectId
                );


            if (error) {

                console.error(
                    "Delete error:",
                    error
                );

                showToast(
                    "Could not delete project.",
                    true
                );

                return;

            }


            // ------------------------------------------------
            // Try deleting cover image from Storage
            // ------------------------------------------------

            if (
                project &&
                project.cover_image
            ) {

                await deleteStorageImage(
                    project.cover_image
                );

            }


            // ------------------------------------------------
            // Close modal
            // ------------------------------------------------

            closeDeleteModal();


            showToast(
                "Project deleted successfully."
            );


            // ------------------------------------------------
            // Reload
            // ------------------------------------------------

            await loadProjects();

        } catch (error) {

            console.error(
                "Unexpected delete error:",
                error
            );

            showToast(
                "Something went wrong while deleting.",
                true
            );

        } finally {

            confirmDelete.disabled =
                false;

            confirmDelete.textContent =
                "DELETE PROJECT";

        }

    }
);


// ------------------------------------------------------------
// DELETE IMAGE FROM STORAGE
// ------------------------------------------------------------

async function deleteStorageImage(imageUrl) {

    try {

        const bucket =
            "project-images";


        // ----------------------------------------------------
        // Find the path after /project-images/
        // ----------------------------------------------------

        const marker =
            `/storage/v1/object/public/${bucket}/`;


        const markerIndex =
            imageUrl.indexOf(marker);


        if (markerIndex === -1) {
            return;
        }


        const filePath =
            decodeURIComponent(
                imageUrl.substring(
                    markerIndex + marker.length
                )
            );


        if (!filePath) {
            return;
        }


        const {
            error
        } = await supabaseClient
            .storage
            .from(bucket)
            .remove([
                filePath
            ]);


        if (error) {

            console.warn(
                "Storage image deletion failed:",
                error
            );

        }

    } catch (error) {

        console.warn(
            "Could not process storage image:",
            error
        );

    }

}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

logoutButton.addEventListener(
    "click",
    async function () {

        logoutButton.disabled =
            true;


        try {

            const {
                error
            } = await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                showToast(
                    "Could not log out.",
                    true
                );

                logoutButton.disabled =
                    false;

                return;

            }


            window.location.href =
                "login.html";


        } catch (error) {

            console.error(
                "Unexpected logout error:",
                error
            );

            logoutButton.disabled =
                false;

        }

    }
);


// ------------------------------------------------------------
// MOBILE SIDEBAR
// ------------------------------------------------------------

menuButton.addEventListener(
    "click",
    function () {

        sidebar.classList.add(
            "open"
        );

    }
);


sidebarClose.addEventListener(
    "click",
    function () {

        sidebar.classList.remove(
            "open"
        );

    }
);


// Close sidebar when clicking a navigation link

const navLinks =
    document.querySelectorAll(
        ".admin-nav-link"
    );


navLinks.forEach(link => {

    link.addEventListener(
        "click",
        function () {

            sidebar.classList.remove(
                "open"
            );

        }
    );

});


// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------

let toastTimer = null;


function showToast(
    message,
    isError = false
) {

    toastMessage.textContent =
        message;


    const icon =
        toast.querySelector("i");


    if (isError) {

        icon.className =
            "fa-solid fa-circle-exclamation";

        toast.classList.add(
            "error"
        );

    } else {

        icon.className =
            "fa-solid fa-circle-check";

        toast.classList.remove(
            "error"
        );

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


// ------------------------------------------------------------
// ESCAPE KEY
// ------------------------------------------------------------

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            if (
                deleteModal.classList.contains(
                    "active"
                )
            ) {

                closeDeleteModal();

            }

        }

    }
);
