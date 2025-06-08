"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import { Edit2, Trash2, Save, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigationStore } from '@/store/navigationStore';

interface NutrientValue {
  N?: string;
}

interface Nutrients {
  [key: string]: NutrientValue;
}

interface Meal {
  id: string;
  date: string;
  name: string;
  imageKey?: string;
  nutrients: Nutrients;
}

const Dashboard = () => {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const { toast } = useToast();

  const navigateToCamera = useNavigationStore(state => state.navigateToCamera);

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekMeals, setWeekMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [currentCategory, setCurrentCategory] = useState("All");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalWeeklyCalories, setTotalWeeklyCalories] = useState<number>(0);
  
  // Add states for edit and delete functionality
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [editedMeal, setEditedMeal] = useState<Meal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Fetch all meals
  useEffect(() => {
    if (!userEmail) return;

    const fetchMeals = async () => {
      setLoading(true);
      try {
        const start = startOfWeek(currentWeek, { weekStartsOn: 1 }).toISOString();
        const end = endOfWeek(currentWeek, { weekStartsOn: 1 }).toISOString();
        const response = await fetch(`/api/meals?startDate=${start}&endDate=${end}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        // parse nutrients
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedMeals = data.map((meal: any) => ({
          ...meal,
          nutrients: Object.fromEntries(
            Object.entries(meal.nutrients).map(([key, value]) => [
              key,
              value && typeof value === 'object' && 'N' in value 
                ? parseFloat(String(value.N)) // Convert to string first
                : value
            ])
          )
        }));

        setMeals(parsedMeals);
      } catch (error) {
        console.error("Failed to fetch meals:", error);
        toast({
          title: "Error",
          description: "Failed to fetch meals. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [userEmail, toast, currentWeek]);

  // Compute weekMeals for the current week and total calories
  useEffect(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const thisWeeksMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.date);
      return mealDate >= start && mealDate <= end;
    });

    // Calculate total calories for the week
    const weeklyCalories = thisWeeksMeals.reduce((total, meal) => {
      const mealCalories = typeof meal.nutrients.calories === 'object'
        ? parseFloat(meal.nutrients.calories.N || '0')
        : (typeof meal.nutrients.calories === 'number' 
            ? meal.nutrients.calories 
            : parseFloat(String(meal.nutrients.calories) || '0'));
      
      return total + mealCalories;
    }, 0);

    setTotalWeeklyCalories(Math.round(weeklyCalories));
    setWeekMeals(thisWeeksMeals);
  }, [currentWeek, meals]);

  // Call AI only when weekMeals changes
  useEffect(() => {
    if (weekMeals.length === 0) {
      console.log("No meals in this week. Skipping AI request.");
      setAiSuggestion(null);
      return;
    }

    const fetchAIRecommendations = async () => {
      try {
        console.log("Sending to AI for analysis...");
        const nutrientData = weekMeals.map((meal) => meal.nutrients);
        const response = await fetch("/api/openai/analyze-nutrients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nutrients: nutrientData })
        });

        const aiResponse = await response.json();
        console.log("Client AI response:", aiResponse);
        setAiSuggestion(aiResponse);
      } catch (error) {
        console.error("Error fetching AI suggestions:", error);
      }
    };

    fetchAIRecommendations();
  }, [weekMeals]);

  // Filter by category
  useEffect(() => {
    if (currentCategory === "All") {
      setFilteredMeals(weekMeals);
      return;
    }

    const catFiltered = weekMeals.filter((meal) => {
      const hour = new Date(meal.date).getHours();
      const mealCat =
        hour < 11
          ? "Breakfast"
          : hour < 16
          ? "Lunch"
          : hour < 20
          ? "Dinner"
          : "Snacks";
      return mealCat === currentCategory;
    });
    setFilteredMeals(catFiltered);
  }, [weekMeals, currentCategory]);

  // Week navigation
  const handlePreviousWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };
  const handleNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  // Toggle expanded meal card
  const toggleExpandMeal = (mealId: string) => {
    if (expandedMeal === mealId) {
      setExpandedMeal(null);
    } else {
      setExpandedMeal(mealId);
    }
  };

  const handleEditClick = (meal: Meal) => {
    setCurrentMeal(meal);
    
    // Create a deep copy of the meal for editing with proper value handling
    const editableMeal = {
      ...meal,
      nutrients: { ...meal.nutrients }
    };
    
    // Convert nutrients to the format expected by the edit form
    Object.keys(editableMeal.nutrients).forEach(key => {
      const nutrientKey = key as keyof typeof editableMeal.nutrients;
      const value = editableMeal.nutrients[nutrientKey];
  
      if (typeof value === 'number') {
        editableMeal.nutrients[nutrientKey] = { N: String(value) };
      } else if (typeof value === 'string') {
        editableMeal.nutrients[key] = { N: value };
      } else if (!value.N) {
        // Ensure N property exists
        editableMeal.nutrients[key] = { 
          ...value, 
          N: value.N || '0' 
        };
      }
    });
    
    setEditedMeal(editableMeal);
    setEditModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (meal: Meal) => {
    setCurrentMeal(meal);
    setDeleteModalOpen(true);
  };

  // Handle nutrient change in edit form
  const handleNutrientChange = (nutrient: string, value: string) => {
    if (!editedMeal) return;
    
    setEditedMeal({
      ...editedMeal,
      nutrients: {
        ...editedMeal.nutrients,
        [nutrient]: { N: value }
      }
    });
  };

  // Handle meal name change in edit form
  const handleNameChange = (name: string) => {
    if (!editedMeal) return;
    
    setEditedMeal({
      ...editedMeal,
      name
    });
  };

  // Handle save edited meal
  const handleSaveEdit = async () => {
    if (!editedMeal || !currentMeal) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Convert nutrients to the expected format
      const formattedNutrients = {
        calories: parseFloat(typeof editedMeal.nutrients.calories === 'object' && editedMeal.nutrients.calories !== null
                ? (editedMeal.nutrients.calories.N || "0") 
                : String(editedMeal.nutrients.calories || 0)),
        protein: parseFloat(typeof editedMeal.nutrients.protein === 'object' && editedMeal.nutrients.protein !== null
                ? (editedMeal.nutrients.protein.N || "0") 
                : String(editedMeal.nutrients.protein || 0)),
        carbohydrates: parseFloat(typeof editedMeal.nutrients.carbohydrates === 'object' && editedMeal.nutrients.carbohydrates !== null
                ? (editedMeal.nutrients.carbohydrates.N || "0") 
                : String(editedMeal.nutrients.carbohydrates || 0)),
        fat: parseFloat(typeof editedMeal.nutrients.fat === 'object' && editedMeal.nutrients.fat !== null
                ? (editedMeal.nutrients.fat.N || "0") 
                : String(editedMeal.nutrients.fat || 0)),
        fiber: parseFloat(typeof editedMeal.nutrients.fiber === 'object' && editedMeal.nutrients.fiber !== null
                ? (editedMeal.nutrients.fiber.N || "0") 
                : String(editedMeal.nutrients.fiber || 0)),
        sugar: parseFloat(typeof editedMeal.nutrients.sugar === 'object' && editedMeal.nutrients.sugar !== null
                ? (editedMeal.nutrients.sugar.N || "0") 
                : String(editedMeal.nutrients.sugar || 0)),
        sodium: parseFloat(typeof editedMeal.nutrients.sodium === 'object' && editedMeal.nutrients.sodium !== null
                ? (editedMeal.nutrients.sodium.N || "0") 
                : String(editedMeal.nutrients.sodium || 0))
      };
      
      // Create a properly formatted nutrients object for the state update
      const nutrientsForState: Nutrients = {
        calories: { N: formattedNutrients.calories.toString() },
        protein: { N: formattedNutrients.protein.toString() },
        carbohydrates: { N: formattedNutrients.carbohydrates.toString() },
        fat: { N: formattedNutrients.fat.toString() },
        fiber: { N: formattedNutrients.fiber.toString() },
        sugar: { N: formattedNutrients.sugar.toString() },
        sodium: { N: formattedNutrients.sodium.toString() }
      };
      
      const response = await fetch('/api/meals/update_meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: currentMeal.date,
          name: editedMeal.name,
          nutrients: formattedNutrients
        })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update meal");
      }
      
      // Update local meals state with edited meal
      setMeals(meals.map(meal => 
        (meal.id === currentMeal.id && meal.date === currentMeal.date) 
          ? { ...meal, name: editedMeal.name, nutrients: nutrientsForState }
          : meal
      ));
      
      // Close the modal
      setEditModalOpen(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Meal updated successfully!",
      });
      
    } catch (error) {
      console.error("Error updating meal:", error);
      setApiError(error instanceof Error ? error.message : "An unexpected error occurred");
      
      toast({
        title: "Error",
        description: "Failed to update meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentMeal) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      console.log("Sending delete request for meal:", {
        date: currentMeal.date
      });
      
      const response = await fetch('/api/meals/delete_meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: currentMeal.date
        })
      });
      
      // First check if the response is ok
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP error: ${response.status}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // If we can't parse JSON, use the status text
          errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // If response is ok, parse the JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        // Check if the response is empty
        const responseText = await response.text();
        if (!responseText) {
          throw new Error("Server returned an empty response");
        } else {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
      }
      
      // At this point we have valid JSON response
      console.log("Delete meal response:", responseData);
      
      // Remove the deleted meal from local state
      setMeals(meals.filter(meal => 
        !(meal.id === currentMeal.id && meal.date === currentMeal.date)
      ));
      
      // Close the modal
      setDeleteModalOpen(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: responseData.message || "Meal deleted successfully!",
      });
      
    } catch (error) {
      console.error("Error deleting meal:", error);
      setApiError(error instanceof Error ? error.message : "An unexpected error occurred");
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Snacks"];

  const renderMealCards = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (filteredMeals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-center text-xl text-red-500 mb-4">
            No {currentCategory.toLowerCase() === 'all' ? '' : currentCategory.toLowerCase()} meals recorded for this week.
          </p>
          <Button 
          variant="outline" 
          className="mt-2"
          onClick={navigateToCamera}
        >
          Add a meal now
        </Button>
        </div>
      );
    }

    return filteredMeals.map((meal, idx) => (
      <Card 
        key={`${meal.id}-${idx}`} 
        className="mb-4 overflow-hidden transition-all duration-200"
      >
        <CardHeader className="p-4 pb-0 flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{meal.name}</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              {format(new Date(meal.date), "EEE, MMM d • h:mm a")}
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(meal)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(meal)}
              className="h-8 w-8 p-0 rounded-full text-red-500"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-xs text-gray-500">Calories</div>
            <div className="font-bold">
              {typeof meal.nutrients.calories === 'object' 
                ? meal.nutrients.calories.N 
                : (typeof meal.nutrients.calories === 'number' 
                    ? meal.nutrients.calories 
                    : 0)}
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-xs text-gray-500">Protein</div>
            <div className="font-bold">
              {typeof meal.nutrients.protein === 'object' 
                ? meal.nutrients.protein.N 
                : (typeof meal.nutrients.protein === 'number' 
                    ? meal.nutrients.protein 
                    : 0)}g
            </div>
          </div>
        </div>
          
          <Button 
            variant="ghost" 
            className="text-xs w-full mt-1 flex items-center justify-center"
            onClick={() => toggleExpandMeal(`${meal.id}-${idx}`)}
          >
            {expandedMeal === `${meal.id}-${idx}` ? 'Show less' : 'Show more'}
          </Button>
          
          {expandedMeal === `${meal.id}-${idx}` && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <div className="text-xs text-gray-500">Carbs</div>
                <div>
                  {typeof meal.nutrients.carbohydrates === 'object' 
                    ? meal.nutrients.carbohydrates.N 
                    : (typeof meal.nutrients.carbohydrates === 'number' 
                        ? meal.nutrients.carbohydrates 
                        : 0)}g
                </div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-gray-500">Fat</div>
                <div>
                  {typeof meal.nutrients.fat === 'object' 
                    ? meal.nutrients.fat.N 
                    : (typeof meal.nutrients.fat === 'number' 
                        ? meal.nutrients.fat 
                        : 0)}g
                </div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-gray-500">Fiber</div>
                <div>
                  {typeof meal.nutrients.fiber === 'object' 
                    ? meal.nutrients.fiber.N 
                    : (typeof meal.nutrients.fiber === 'number' 
                        ? meal.nutrients.fiber 
                        : 0)}g
                </div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-gray-500">Sugar</div>
                <div>
                  {typeof meal.nutrients.sugar === 'object' 
                    ? meal.nutrients.sugar.N 
                    : (typeof meal.nutrients.sugar === 'number' 
                        ? meal.nutrients.sugar 
                        : 0)}g
                </div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-gray-500">Sodium</div>
                <div>
                  {typeof meal.nutrients.sodium === 'object' 
                    ? meal.nutrients.sodium.N 
                    : (typeof meal.nutrients.sodium === 'number' 
                        ? meal.nutrients.sodium 
                        : 0)}mg
                </div>
              </div>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Weekly Diet Overview</h1>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              className="h-8 w-8 p-0 rounded-full"
            >
              <ArrowLeft size={16} />
            </Button>
            
            <h2 className="text-sm font-medium">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="h-8 w-8 p-0 rounded-full"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Weekly Calorie Summary */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Weekly Total</h3>
            <p className="text-lg font-bold">{totalWeeklyCalories.toLocaleString()} calories</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {weekMeals.length} meals
          </div>
        </div>
      
        {/* Category Filter */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={currentCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentCategory(cat)}
                className={`text-xs h-8 ${currentCategory === cat ? "bg-blue-600" : ""}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        
        {/* AI Suggestions */}
        {aiSuggestion?.recommendations && (
          <Card className="mb-4 bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold text-blue-900">AI Nutrition Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {weekMeals.length === 0 ? (
                <p className="text-sm text-gray-700">
                  No meal history, please record your meals.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(aiSuggestion.recommendations).map(([nutrient, details]) => {
                    const text = typeof details === "string" ? details : JSON.stringify(details);
                    return (
                      <div key={nutrient} className="text-sm">
                        <span className="font-medium capitalize">{nutrient}:</span> {text}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Meal List */}
        <div className="space-y-2 mb-16">
          {renderMealCards()}
        </div>
      </div>

      {/* Edit Meal Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle as="h3">Edit Meal</DialogTitle>
      </DialogHeader>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {editedMeal && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Meal Name</label>
              <Input
                value={editedMeal.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Nutrients</h4>
              
              {Object.entries(editedMeal.nutrients).map(([key, value]) => {
              // Handle different types of values to get the actual number
              const inputValue = typeof value === 'object' && value !== null
                ? (value.N || "0")
                : (typeof value === 'number'
                    ? String(value)  // Use String() instead of toString()
                    : "0");
                      
                return (
                  <div key={key} className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium capitalize">{key}</label>
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => handleNutrientChange(key, e.target.value)}
                      className="w-full"
                      min="0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className={undefined}>
          <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <p>Are you sure you want to delete this meal?</p>
            {currentMeal && (
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p><strong>Meal:</strong> {currentMeal.name}</p>
                <p><strong>Date:</strong> {format(new Date(currentMeal.date), "MMM d, yyyy hh:mm a")}</p>
              </div>
            )}
            <p className="mt-4 text-red-600">This action cannot be undone.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Deleting</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Dashboard;