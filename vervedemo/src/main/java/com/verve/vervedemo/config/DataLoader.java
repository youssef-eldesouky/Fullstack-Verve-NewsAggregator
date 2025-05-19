package com.verve.vervedemo.config;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.verve.vervedemo.model.entity.InterestCategory;
import com.verve.vervedemo.model.entity.NewArticle;
import com.verve.vervedemo.model.entity.User;
import com.verve.vervedemo.model.enums.Role;
import com.verve.vervedemo.repo.ArticleRepository;
import com.verve.vervedemo.repo.InterestCategoryRepository;
import com.verve.vervedemo.repo.UserRepository;

@Configuration
public class DataLoader {

    /**
     * Initialize sample data for the application
     */
    @Bean
    public CommandLineRunner initData(
            InterestCategoryRepository interestCategoryRepository,
            UserRepository userRepository,
            ArticleRepository articleRepository) {
        
        return args -> {
            // Check if we already have data
            if (interestCategoryRepository.count() > 0) {
                System.out.println("Database already has data, skipping initialization");
                return;
            }
            
            System.out.println("Initializing sample data...");
            
            // Create interest categories
            List<String> interestNames = Arrays.asList(
                "Technology", "Science", "Health", "Business", 
                "Politics", "Sports", "Entertainment", "Travel",
                "Food", "Fashion", "Education", "Environment"
            );
            
            Map<String, InterestCategory> interests = new HashMap<>();
            
            for (String name : interestNames) {
                InterestCategory interest = new InterestCategory(name);
                interestCategoryRepository.save(interest);
                interests.put(name, interest);
                System.out.println("Created interest category: " + name);
            }
            
            // Create sample users with different interests
            User techUser = new User("techguru", "password", "tech@example.com");
            techUser.setRole(Role.USER);
            Set<InterestCategory> techInterests = new HashSet<>();
            techInterests.add(interests.get("Technology"));
            techInterests.add(interests.get("Science"));
            techInterests.add(interests.get("Business"));
            techUser.setInterests(techInterests);
            userRepository.save(techUser);
            
            User healthUser = new User("healthnut", "password", "health@example.com");
            healthUser.setRole(Role.USER);
            Set<InterestCategory> healthInterests = new HashSet<>();
            healthInterests.add(interests.get("Health"));
            healthInterests.add(interests.get("Food"));
            healthInterests.add(interests.get("Sports"));
            healthUser.setInterests(healthInterests);
            userRepository.save(healthUser);
            
            User newsUser = new User("newsreader", "password", "news@example.com");
            newsUser.setRole(Role.USER);
            Set<InterestCategory> newsInterests = new HashSet<>();
            newsInterests.add(interests.get("Politics"));
            newsInterests.add(interests.get("Business"));
            newsInterests.add(interests.get("Environment"));
            newsUser.setInterests(newsInterests);
            userRepository.save(newsUser);
            
            System.out.println("Created sample users");
            
            // Create sample articles for different categories
            createArticle(articleRepository, techUser, "Technology", 
                    "New Breakthrough in Quantum Computing", 
                    "Scientists have achieved a major breakthrough in quantum computing, developing a new type of qubit that is more stable and less prone to errors. This could pave the way for practical quantum computers within the next decade.");
            
            createArticle(articleRepository, techUser, "Technology", 
                    "The Future of AI in Healthcare", 
                    "Artificial intelligence is revolutionizing healthcare by improving diagnosis accuracy, optimizing treatment plans, and reducing administrative burdens. Experts predict that AI could save the healthcare industry billions of dollars annually while improving patient outcomes.");
            
            createArticle(articleRepository, healthUser, "Health", 
                    "Benefits of Intermittent Fasting", 
                    "A new study confirms that intermittent fasting can lead to significant improvements in metabolic health, weight management, and longevity. Researchers found that even time-restricted eating windows of 8-10 hours can provide benefits.");
            
            createArticle(articleRepository, healthUser, "Food", 
                    "Mediterranean Diet Ranked Best for Heart Health", 
                    "The Mediterranean diet, rich in olive oil, nuts, fish, and vegetables, has once again been ranked as the best diet for cardiovascular health by nutrition experts. Studies show it can reduce the risk of heart disease by up to 30%.");
            
            createArticle(articleRepository, newsUser, "Politics", 
                    "Global Summit Addresses Climate Change", 
                    "World leaders gathered this week to discuss ambitious new targets for reducing carbon emissions by 2030. The summit resulted in pledges to increase renewable energy investments and phase out coal power plants in major economies.");
            
            createArticle(articleRepository, newsUser, "Business", 
                    "Tech Startup Valuations Reach New Heights", 
                    "Venture capital funding has reached unprecedented levels in 2023, with tech startups in AI, clean energy, and biotech attracting multi-billion dollar valuations. Experts warn of a potential bubble but others see sustainable growth in these sectors.");
            
            createArticle(articleRepository, techUser, "Science", 
                    "Mars Rover Discovers Signs of Ancient Life", 
                    "NASA's latest Mars rover has uncovered compelling evidence of microbial life that may have existed billions of years ago on the red planet. The findings include organic compounds and mineral formations typically associated with biological processes.");
            
            createArticle(articleRepository, healthUser, "Sports", 
                    "New Training Method Enhances Athletic Performance", 
                    "A revolutionary training approach combining high-intensity intervals with neurological stimulation has shown remarkable results in improving athletic performance. Olympic athletes testing the method have seen up to 15% improvements in endurance and strength.");
            
            System.out.println("Created sample articles");
            System.out.println("Data initialization complete!");
        };
    }
    
    private void createArticle(ArticleRepository repo, User publisher, String category, String title, String content) {
        NewArticle article = new NewArticle();
        article.setPublisher(publisher);
        article.setCategory(category);
        article.setTitle(title);
        article.setContent(content);
        repo.save(article);
    }
} 