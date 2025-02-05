$(document).ready(function () {
  let currentPage = 1;
  let totalPages = 1;
  let newsData = [];
  let favorites = [];
  let isFavoritesView = false; // Variable para controlar el estado de favoritos

  // Función para normalizar cadenas
  function normalizeString(str) {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  }

  // Función para cargar el feed ATOM
  $("#load-feed").click(function () {
    const url = $("#atom-url").val();
    if (url) {
      loadFeed(url);
    }
  });

  function loadFeed(url) {
    $.ajax({
      url: url,
      type: "GET",
      dataType: "xml",
      success: function (xml) {
        processXML(xml);
      },
      error: function () {
        alert("Error al cargar el feed ATOM.");
      },
    });
  }

  function processXML(xml) {
    const items = $(xml).find("item");
    newsData = [];
    
    items.each(function () {
      const title = $(this).find("title").text();
      const link = $(this).find("link").text();
      const author = $(this).find("author").text();
      const date = $(this).find("pubDate").text();
      const description = $(this).find("description").text();
      let imageUrl = "";
  
      // Intentar extraer la URL de la imagen desde varios posibles elementos
      const mediaContent = $(this).find("media\\:content, content"); // Algunas veces usan 'media:content'
      if (mediaContent.length > 0) {
        imageUrl = mediaContent.attr("url"); // En muchos feeds, la URL de la imagen está en el atributo 'url'
      } else {
        const enclosure = $(this).find("enclosure");
        if (enclosure.length > 0) {
          imageUrl = enclosure.attr("url"); // Si hay un 'enclosure' con la URL de la imagen
        }
      }
  
      const categories = [];
      $(this).find("category").each(function () {
        categories.push($(this).text());
      });
  
      newsData.push({
        title,
        link,
        author,
        date,
        description,
        imageUrl,
        categories,
      });
    });
  
    totalPages = Math.ceil(newsData.length / 10);
    displayNews();
  }
  

  // Función para mostrar las noticias
  function displayNews() {
    const dataToDisplay = isFavoritesView ? favorites : newsData;
    const query = $("#search-input").val();
    const filteredNews = filterNews(query, dataToDisplay);
  
    const startIndex = (currentPage - 1) * 10;
    const endIndex = currentPage * 10;
    const pageNews = filteredNews.slice(startIndex, endIndex);
  
    $("#news-container").empty();
    pageNews.forEach(function (news) {
      const categories = news.categories
        .map((cat) => `<span class="badge bg-secondary">${cat}</span>`)
        .join(" ");
        
      // Aquí se extrae la imagen si existe
      const image = news.imageUrl
        ? `<img src="${news.imageUrl}" class="card-img-top" alt="${news.title}">`
        : "";
  
      const isFavorite = favorites.some(
        (item) =>
          normalizeString(item.title) === normalizeString(news.title)
      );
  
      const cardHTML = `
        <div class="col">
          <div class="card">
            ${image}  <!-- Aquí se coloca la imagen si existe -->
            <div class="card-body">
              <h5 class="card-title">${news.title}</h5>
              <p class="card-text">${news.description}</p>
              <p class="text-muted">Por ${news.author} el ${news.date}</p>
              <div>${categories}</div>
              <button class="btn ${
                isFavorite ? "btn-outline-danger" : "btn-outline-warning"
              } like-button" data-title="${news.title}">
                <i class="fas fa-heart ${isFavorite ? "text-danger" : ""}"></i> Marcar como favorita
              </button>
              <a href="${news.link}" class="btn btn-primary mt-2">Leer más</a>
            </div>
          </div>
        </div>
      `;
      $("#news-container").append(cardHTML);
    });
  
    updatePagination(filteredNews.length);
  }
  
  // Filtrar noticias por título o descripción
  function filterNews(query, data) {
    return data.filter(function (news) {
      const searchQuery = normalizeString(query);
      const title = normalizeString(news.title);
      const description = normalizeString(news.description);
      return title.includes(searchQuery) || description.includes(searchQuery);
    });
  }

  // Actualizar la paginación
  function updatePagination(filteredNewsCount) {
    const totalFilteredPages = Math.ceil(filteredNewsCount / 10);
    $("#pagination").empty();
    for (let i = 1; i <= totalFilteredPages; i++) {
      const activeClass = i === currentPage ? "active" : "";
      const pageItem = `<li class="page-item ${activeClass}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
      $("#pagination").append(pageItem);
    }
  }

  // Cambiar de página
  window.changePage = function (page) {
    currentPage = page;
    displayNews();
  };

  // Cambiar a vista de favoritos
  $("#toggle-favorites").click(function () {
    isFavoritesView = !isFavoritesView;
    currentPage = 1;
    displayNews();
    const buttonText = isFavoritesView ? "Ver Todas las Noticias" : "Ver Favoritos";
    $(this).text(buttonText);
  });

  // Marcar noticias como favoritas
  $(document).on("click", ".like-button", function () {
    const button = $(this);
    const icon = button.find("i");
    const title = button.data("title");

    // Buscar la noticia en el array general
    const news = newsData.find(
      (item) => normalizeString(item.title) === normalizeString(title)
    );

    if (news) {
      const isFavorite = favorites.some(
        (item) => normalizeString(item.title) === normalizeString(title)
      );

      if (isFavorite) {
        // Quitar de favoritos
        favorites = favorites.filter(
          (item) => normalizeString(item.title) !== normalizeString(title)
        );
        icon.removeClass("text-danger");
        button.removeClass("btn-outline-danger").addClass("btn-outline-warning");
      } else {
        // Añadir a favoritos
        favorites.push(news);
        icon.addClass("text-danger");
        button.removeClass("btn-outline-warning").addClass("btn-outline-danger");
      }
    }
  });

  // Buscador en tiempo real
  $("#search-input").on("input", function () {
    displayNews();
  });
});
