'use strict';

var picturesContainer = document.querySelector('.pictures'),
  filtersContainer = document.querySelector('.filters'),
  filtersList = filtersContainer.querySelectorAll('.filters-radio'),
  pictureTemplate = document.querySelector('#picture-template'),
  pictureToClone,
  pictures = [],
  IMAGE_SIZE = 182,
  TIMEOUT = 10000,
  NEW_PICTURES_DELTA = 14 * 24 * 60 * 60 * 1000;

/**
 * Поддерживаемые способы фильтрации
 * @type {Object}
 */
var filters = {
  POPULAR: 'filter-popular',
  NEW: 'filter-new',
  DISCUSSED: 'filter-discussed',
  DEFAULT: 'filter-popular'
};

// Обеспечение кроссбраузерной шаблонизации
if ('content' in pictureTemplate) {
  pictureToClone = pictureTemplate.content.querySelector('.picture');
} else {
  pictureToClone = pictureTemplate.querySelector('.picture');
}

/**
 * Обработка ошибок взаимодействия с сервером
 */
function onAjaxError() {
  picturesContainer.classList.remove('pictures-loading');
  picturesContainer.classList.add('pictures-failure');
}

/**
 * Загрузка картинок и информации о них с сервера
 * @param  {Function} callback
 */
var getPictures = function(callback) {
  var xhr = new XMLHttpRequest();

  picturesContainer.classList.add('pictures-loading');

  xhr.onload = function(event) {
    var loadedData = JSON.parse(event.target.response);
    picturesContainer.classList.remove('pictures-loading');
    callback(loadedData);
  };

  xhr.onerror = onAjaxError;

  xhr.timeout = TIMEOUT;
  xhr.ontimeout = onAjaxError;

  xhr.open('GET', 'https://o0.github.io/assets/json/pictures.json');
  xhr.send();
};

/**
 * Разбор и отрисовка информации об одной картинке
 * @param  {Object} data  Информация о картинке
 */
var getPictureElement = function(data) {
  var element = pictureToClone.cloneNode(true),
    pictureImage = new Image(IMAGE_SIZE, IMAGE_SIZE),
    pictureLoadTimeout;

  element.querySelector('.picture-comments').textContent = data.comments;
  element.querySelector('.picture-likes').textContent = data.likes;
  picturesContainer.appendChild(element);

  pictureImage.onload = function() {
    clearTimeout(pictureLoadTimeout);
    element.querySelector('img').src = pictureImage.src;
  };

  pictureImage.onerror = function() {
    element.classList.add('picture-load-failure');
  };

  pictureImage.src = data.url;

  pictureLoadTimeout = setTimeout( function() {
    pictureImage.src = '';
    element.classList.add('picture-load-failure');
  }, TIMEOUT);
};

/**
 * Отрисовка информации обо всех картинках
 * @param  {Object} picture  Информация о картинке
 */
var renderPictures = function(picture) {
  picturesContainer.innerHTML = '';
  picture.forEach(getPictureElement);
};

/**
 * Получение списка картинок, загруженных за даты, более поздние, чем
 * минимально допустимая дата; сортировка этого списка по убыванию дат
 * @param  {Object} picturesToFilter  Список картинок, полученный от сервера
 * @return {Object}                   Отфильтрованный список картинок
 */
var getNewPictures = function(picturesToFilter) {
  var minDate = Date.now() - NEW_PICTURES_DELTA;

  var newPictures = picturesToFilter.filter(function(pictureData) {
    var pictureDate = new Date(pictureData.date).getTime();
    return pictureDate >= minDate;
  });

  picturesToFilter = newPictures.sort(function(a, b) {
    var pictureDate1 = new Date(a.date).getTime(),
      pictureDate2 = new Date(b.date).getTime();
    return pictureDate2 - pictureDate1;
  });

  return picturesToFilter;
};

/**
 * Сортировка картинок по убыванию количества комментариев к ним
 * @param  {Object} a  Информация об одной картинке
 * @param  {Object} b  Информация о второй картинке
 * @return {Object}    Список отсортированных картинок
 */
var getDiscussedPictures = function(picturesToFilter) {
  picturesToFilter.sort(function(a, b) {
    return b.comments - a.comments;
  });
  return picturesToFilter;
};

/**
 * Фильтрация списка картинок
 * @param  {Object} picturesList  Исходный список картинок
 * @param  {String} filter        Примененный фильтр
 * @return {Object}               Отфильтрованный списк картинок
 */
var getFilteredPictures = function(picturesList, filter) {
  var picturesToFilter = picturesList.slice();
  switch (filter) {
    case filters.NEW:
      return getNewPictures(picturesToFilter);
    case filters.DISCUSSED:
      return getDiscussedPictures(picturesToFilter);
    case filter.POPULAR:
    default:
      return picturesToFilter;
  }
};

/**
 * Обработка события нажатия на фильтры
 */
var setFiltersEnabled = function() {
  for (var i = 0; i < filtersList.length; i++) {
    filtersList[i].onclick = function() {
      setFilterEnabled(this.id);
    };
  }
};

/**
 * Применение фильтрации согласно выбранного способа
 * @param {String} filter  Выбранный фильтр
 */
var setFilterEnabled = function(filter) {
  renderPictures( getFilteredPictures(pictures, filter) );
  for (var j = 0; j < filtersList.length; j++) {
    filtersList[j].removeAttribute('checked');
  }
  filtersContainer.querySelector('#' + filter).setAttribute('checked', 'true');
};

/**
 * Отрисовка страницы сразу после получения данных с сервера
 */
getPictures(function(loaderPictures) {
  pictures = loaderPictures;
  setFiltersEnabled();
  setFilterEnabled(filters.DEFAULT);
  filtersContainer.classList.remove('hidden');
});
