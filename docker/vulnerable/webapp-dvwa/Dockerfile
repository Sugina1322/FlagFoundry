FROM php:8.2-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql
COPY index.php /var/www/html/index.php
COPY flag.txt /var/www/flag.txt
RUN chown -R www-data:www-data /var/www/html /var/www/flag.txt

EXPOSE 80
CMD ["apache2-foreground"]

