const allCategory = "http://localhost:8080/beesixcake/api/category";
const categoryApi = "http://localhost:8080/beesixcake/api/category"; // API endpoint

var app = angular.module('myApp', []);

app.controller('CategoryController', function($scope, $http) {
    $scope.categories = [];
    $scope.selectedCategory = {}; // Đối tượng lưu trữ danh mục được chọn

    // Hàm tải danh mục
    function loadCategories() {
        console.log("Tải lại danh sách danh mục...");
        $http.get(allCategory)
            .then(function(response) {
                $scope.categories = response.data;
            }, function(error) {
                console.error("Lỗi khi gọi API", error);
            });
    }

    // Gọi hàm loadCategories khi khởi tạo
    loadCategories();

    // Chọn danh mục để sửa và chuyển đến tab sửa
    $scope.goToEdit = function(category) {
        $scope.selectedCategory = angular.copy(category); // Lưu thông tin danh mục
        $('#profile-tab').tab('show'); // Chuyển sang tab EDIT
    };

    // Thêm danh mục mới
    $scope.addCategory = function() {
        $http.post(categoryApi, $scope.selectedCategory)
            .then(function(response) {
                $scope.categories.push(response.data); // Thêm danh mục mới vào danh sách
                $scope.resetForm(); // Reset form
                $('#password-tab').tab('show'); // Chuyển về tab LIST
            }, function(error) {
                console.error("Lỗi khi thêm danh mục", error);
            });
    };

    // Sửa danh mục
    $scope.editCategory = function() {
        $http.put(categoryApi + '/' + $scope.selectedCategory.idcategory, $scope.selectedCategory)
            .then(function(response) {
                var index = $scope.categories.findIndex(function(c) {
                    return c.idcategory === $scope.selectedCategory.idcategory;
                });
                $scope.categories[index] = response.data; // Cập nhật danh mục
                $scope.resetForm(); // Reset form
                $('#password-tab').tab('show'); // Chuyển về tab LIST
            }, function(error) {
                console.error("Lỗi khi sửa danh mục", error);
            });
    };

    // Xóa danh mục
    $scope.deleteCategory = function(category) {
        if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) { // Xác nhận xóa
            $http.delete(categoryApi + '/' + category.idcategory)
                .then(function(response) {
                    loadCategories(); // Tải lại danh sách sau khi xóa
                    console.log("xóa ok");
                }, function(error) {
                    loadCategories();
                    console.error("Lỗi khi xóa danh mục", error);
                });
        }
    };

    // Reset form
    $scope.resetForm = function() {
        $scope.selectedCategory = {};
    };
});