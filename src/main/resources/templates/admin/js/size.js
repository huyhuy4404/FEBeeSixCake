var app = angular.module('myApp', []);

app.controller('SizeController', function($scope, $http) {
    $scope.Sizes = [];  // Danh sách kích thước
    $scope.selectedSize = {};  // Kích thước đang chọn
    $scope.isEditMode = false;
    $scope.message = '';
    $scope.messageType = '';

    // Hàm hiển thị thông báo
    $scope.showMessage = function(message, type) {
        console.log('Message:', message);  // Kiểm tra giá trị message
        $scope.message = message;  // Nội dung thông báo
        $scope.messageType = type;  // Kiểu thông báo: 'success' hoặc 'error'
    };
    
    // Hàm load danh sách kích thước từ API
    $scope.loadSizes = function() {
        $scope.selectedSize = {};  // Đặt lại form kích thước
        $scope.isEditMode = false; // Thoát khỏi chế độ chỉnh sửa (nếu đang chỉnh sửa)
        $scope.message = '';       // Xóa thông báo trước đó (nếu có)
    
        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function(response) {
                $scope.Sizes = response.data;  // Cập nhật danh sách kích thước
              
            })
            .catch(function(error) {
                $scope.showMessage('Có lỗi xảy ra khi làm mới danh sách.', 'error');
            });
    };
    
    $scope.addSize = function() {
        // Kiểm tra xem kích thước đã tồn tại trong danh sách chưa
        const sizeExists = $scope.Sizes.some(function(size) {
            return size.name === $scope.selectedSize.name;  // Giả sử "name" là thuộc tính dùng để xác định kích thước
        });
    
        if (sizeExists) {
            $scope.showMessage('Kích thước đã tồn tại!', 'error');
            $scope.selectedSize = {};  // Reset form nếu kích thước đã tồn tại
            return;  // Dừng lại nếu kích thước đã tồn tại
        }
    
        // Nếu không có trùng lặp, thực hiện thêm kích thước
        $http.post('http://localhost:8080/beesixcake/api/size', $scope.selectedSize)
            .then(function(response) {
                $scope.showMessage('Thêm kích thước thành công!', 'success');
                $scope.Sizes.unshift(response.data);  // Thêm kích thước mới vào đầu danh sách
                $scope.selectedSize = {};  // Reset form sau khi thêm thành công
            })
            .catch(function(error) {
                $scope.showMessage('Có lỗi xảy ra khi thêm kích thước.', 'error');
            });
    };
    
    
    // Hàm chỉnh sửa kích thước
    $scope.editSize = function(size) {
        $scope.selectedSize = angular.copy(size);  // Sao chép dữ liệu kích thước vào form
        $scope.isEditMode = true;
    
        // Kích hoạt tab "Chỉnh sửa"
        var editTab = document.getElementById('edit-tab');
        var tab = new bootstrap.Tab(editTab); // Sử dụng Bootstrap Tab
        tab.show();  // Hiển thị tab "Chỉnh sửa"
    };

// Hàm cập nhật kích thước
$scope.updateSize = function() {
    $http.put('http://localhost:8080/beesixcake/api/size/' + $scope.selectedSize.idsize, $scope.selectedSize)
        .then(function(response) {
            $scope.showMessage('Cập nhật kích thước thành công!', 'success');
            $scope.loadSizes();  // Tải lại danh sách
            $scope.isEditMode = false;  // Tắt chế độ chỉnh sửa
            $scope.selectedSize = {};  // Reset form
        })
        .catch(function(error) {
            $scope.showMessage('Có lỗi xảy ra khi cập nhật kích thước.', 'error');
        });
};

// Hàm xóa kích thước
$scope.deleteSize = function(idsize) {
    if (confirm('Bạn có chắc chắn muốn xóa kích thước này?')) {
        $http.delete('http://localhost:8080/beesixcake/api/size/' + idsize)
            .then(function(response) {
                $scope.showMessage('Xóa kích thước thành công!', 'success');
                $scope.loadSizes();  // Tải lại danh sách
            })
            .catch(function(error) {
                $scope.showMessage('Có lỗi xảy ra khi xóa kích thước.', 'error');
            });
    }
};



    // Tải danh sách kích thước khi khởi tạo
    $scope.loadSizes();
});
