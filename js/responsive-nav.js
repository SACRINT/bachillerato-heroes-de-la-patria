document.addEventListener('DOMContentLoaded', function () {
    const nav = document.getElementById('main-nav-list');
    if (!nav) return;
    const dropdown = nav.querySelector('.nav-item.dropdown');
    if (!dropdown) return;
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    if (!dropdownMenu) return;

    const allItems = Array.from(nav.querySelectorAll('.nav-item:not(.dropdown)'));

    function debounce(func, wait = 25) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function updateNav() {
        const isCollapsed = document.querySelector('.navbar-toggler').offsetParent !== null;
        if (isCollapsed) {
            allItems.forEach(item => item.style.display = 'block');
            dropdown.style.display = 'none';
            return;
        }

        // 1. Reset the state for recalculation.
        dropdownMenu.innerHTML = '';
        allItems.forEach(item => item.style.display = 'block');
        dropdown.style.display = 'none';

        // 2. Force browser reflow.
        void nav.offsetHeight;

        // 3. Calculate available space more precisely
        const navContainer = nav.parentElement; // .navbar-collapse
        const navbarContainer = document.querySelector('.navbar .container-fluid');
        const navbarBrand = document.querySelector('.navbar-brand');
        
        // Get actual measurements
        const navbarRect = navbarContainer.getBoundingClientRect();
        const brandRect = navbarBrand.getBoundingClientRect();
        
        // Calculate available width with a more generous safety margin
        // We need to account for: brand width + padding + margin + safety buffer
        const safetyMargin = 120; // Extra generous safety margin
        const availableWidth = navbarRect.width - brandRect.width - safetyMargin;
        
        // Calculate total width of all visible items
        let totalWidth = 0;
        const itemWidths = [];
        
        allItems.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            itemWidths.push(itemRect.width);
            totalWidth += itemRect.width;
        });

        // 4. Get the actual width of the "More" button when visible
        dropdown.style.display = 'block';
        void dropdown.offsetHeight; // Force reflow
        const moreButtonWidth = dropdown.getBoundingClientRect().width;
        dropdown.style.display = 'none';

        // 5. Determine which items can fit without the "More" button
        let visibleItemsWidth = 0;
        let visibleItemsCount = 0;
        
        for (let i = 0; i < allItems.length; i++) {
            if (visibleItemsWidth + itemWidths[i] <= availableWidth) {
                visibleItemsWidth += itemWidths[i];
                visibleItemsCount++;
            } else {
                break;
            }
        }

        // If all items fit without "More" button, show all and exit
        if (visibleItemsCount === allItems.length) {
            return;
        }

        // 6. Calculate how many items can fit WITH the "More" button
        // Use a very conservative approach - subtract more button width + generous extra margin
        const maxWidthWithMoreButton = availableWidth - moreButtonWidth - 40; // Extra generous 40px margin
        visibleItemsWidth = 0;
        visibleItemsCount = 0;
        
        for (let i = 0; i < allItems.length; i++) {
            const potentialWidth = visibleItemsWidth + itemWidths[i];
            if (potentialWidth <= maxWidthWithMoreButton) {
                visibleItemsWidth += itemWidths[i];
                visibleItemsCount++;
            } else {
                break;
            }
        }

        // Ensure we always hide at least one item if we're showing the "More" button
        if (visibleItemsCount >= allItems.length - 1) {
            visibleItemsCount = allItems.length - 2; // Hide at least 2 items to make "More" worthwhile
        }

        // 7. Hide items that don't fit and add them to dropdown
        for (let i = allItems.length - 1; i >= visibleItemsCount; i--) {
            const item = allItems[i];
            item.style.display = 'none';

            const link = item.querySelector('a').cloneNode(true);
            link.classList.remove('nav-link');
            link.classList.add('dropdown-item');
            const newLi = document.createElement('li');
            newLi.appendChild(link);
            dropdownMenu.prepend(newLi);
        }

        // 8. Show the "More" dropdown
        dropdown.style.display = 'block';
    }

    window.addEventListener('load', updateNav);
    window.addEventListener('resize', debounce(updateNav, 50));
});