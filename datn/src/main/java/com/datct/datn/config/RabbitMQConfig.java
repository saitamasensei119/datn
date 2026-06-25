package com.datct.datn.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ENROLLMENT_QUEUE = "enrollment_queue";
    public static final String ENROLLMENT_EXCHANGE = "enrollment_exchange";
    public static final String ENROLLMENT_ROUTING_KEY = "enrollment_routing_key";

    @Bean
    public Queue enrollmentQueue() {
        return new Queue(ENROLLMENT_QUEUE, true);
    }

    @Bean
    public DirectExchange enrollmentExchange() {
        return new DirectExchange(ENROLLMENT_EXCHANGE);
    }

    @Bean
    public Binding enrollmentBinding(Queue enrollmentQueue, DirectExchange enrollmentExchange) {
        return BindingBuilder.bind(enrollmentQueue).to(enrollmentExchange).with(ENROLLMENT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
