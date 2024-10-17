var app = angular.module('myApp', []);

app.controller('LanguageController', function($scope, $http) {
    $scope.currentLanguage = 'Tiếng Việt';
    $scope.translations = {};

    // Hàm thay đổi ngôn ngữ
    $scope.changeLanguage = function(lang) {
        $http.get('translations.json').then(function(response) {
            $scope.translations = response.data[lang];
            $scope.currentLanguage = lang;

            // Lưu ngôn ngữ đã chọn vào localStorage
            localStorage.setItem('selectedLanguage', lang);
        });
    };

    // Kiểm tra và tải ngôn ngữ đã lưu trong localStorage
    var savedLanguage = localStorage.getItem('selectedLanguage') || 'Tiếng Việt';
    $scope.changeLanguage(savedLanguage);
});
